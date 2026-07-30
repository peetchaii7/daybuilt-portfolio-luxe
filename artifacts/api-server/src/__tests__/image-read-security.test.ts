/**
 * Integration tests for the private image read path:
 *   GET /api/leads/:id/images/:kind
 *   GET /api/leads/:id/generation
 *
 * These prove a customer holding one valid design token can never read
 * another lead's room photo or AI render, that admin-key access works, and
 * that lead-id probing is indistinguishable from a bad credential.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { db, leadsTable } from '@workspace/db';
import { inArray } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../app';
import { ObjectStorageService } from '../lib/objectStorage';

const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(120, 7),
]);

// A lead id that cannot exist (serial ids start at 1 and this is far above
// anything the dev database will ever reach in tests).
const NONEXISTENT_LEAD_ID = 2147483000;

const createdLeadIds: number[] = [];
const uploadedObjectPaths: string[] = [];

const TEST_ADMIN_KEY = `test-admin-${randomBytes(16).toString('hex')}`;
let previousAdminKey: string | undefined;

interface TestLead {
  id: number;
  token: string;
}

async function uploadValidImage() {
  const urlRes = await request(app)
    .post('/api/storage/uploads/request-url')
    .send({ name: 'room.png', size: PNG_BYTES.length, contentType: 'image/png' });
  expect(urlRes.status).toBe(200);
  const { uploadProof, objectPath } = urlRes.body as {
    uploadProof: string;
    objectPath: string;
  };

  const putRes = await request(app)
    .put('/api/storage/uploads')
    .set('x-upload-token', uploadProof)
    .set('content-type', 'image/png')
    .send(PNG_BYTES);
  expect(putRes.status).toBe(204);
  uploadedObjectPaths.push(objectPath);
  return { uploadProof, objectPath };
}

async function createDesignLead(): Promise<TestLead> {
  const { uploadProof, objectPath } = await uploadValidImage();
  const res = await request(app)
    .post('/api/leads')
    .send({
      name: 'Image Read Test',
      email: 'image-read-security-test@example.com',
      source: 'design-studio',
      roomType: 'living-room',
      roomSize: '20 sqm',
      builtInType: 'tv-wall',
      style: 'Modern Luxury',
      colorTone: 'Warm Neutral',
      keepLayout: 'yes',
      timeline: '1-3 months',
      imageUrl: objectPath,
      designRequestId: `test-${randomUUID()}${randomUUID()}`,
      uploadProof,
    });
  expect(res.status).toBe(201);
  const id = res.body.id as number;
  const token = res.body.accessToken as string;
  expect(typeof id).toBe('number');
  expect(typeof token).toBe('string');
  createdLeadIds.push(id);
  return { id, token };
}

let leadA: TestLead;
let leadB: TestLead;

beforeAll(async () => {
  if (!process.env.SESSION_SECRET || !process.env.DATABASE_URL) {
    throw new Error('Tests require SESSION_SECRET and DATABASE_URL');
  }
  previousAdminKey = process.env.ADMIN_KEY;
  process.env.ADMIN_KEY = TEST_ADMIN_KEY;

  leadA = await createDesignLead();
  leadB = await createDesignLead();
});

afterAll(async () => {
  if (previousAdminKey === undefined) {
    delete process.env.ADMIN_KEY;
  } else {
    process.env.ADMIN_KEY = previousAdminKey;
  }

  if (createdLeadIds.length > 0) {
    await db.delete(leadsTable).where(inArray(leadsTable.id, createdLeadIds));
  }

  const storage = new ObjectStorageService();
  const results = await Promise.allSettled(
    uploadedObjectPaths.map((path) => storage.deleteCustomerUpload(path)),
  );
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0) {
    throw new Error(
      `Failed to clean up ${failed.length} test upload(s) from object storage`,
    );
  }
});

describe('GET /api/leads/:id/images/:kind auth', () => {
  it('rejects a missing token', async () => {
    const res = await request(app).get(`/api/leads/${leadA.id}/images/source`);
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).not.toMatch(/^image\//);
  });

  it('rejects a garbage token', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA.id}/images/source`)
      .set('x-design-token', 'not-a-real-token');
    expect(res.status).toBe(401);
  });

  it("rejects another lead's valid token", async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA.id}/images/source`)
      .set('x-design-token', leadB.token);
    expect(res.status).toBe(401);
  });

  it('rejects a wrong admin key', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA.id}/images/source`)
      .set('x-admin-key', `${TEST_ADMIN_KEY}-wrong`);
    expect(res.status).toBe(401);
  });

  it("serves the lead's own source photo with its own token", async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA.id}/images/source`)
      .set('x-design-token', leadA.token);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cache-control']).toContain('private');
  });

  it('serves the photo to the admin key without a customer token', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA.id}/images/source`)
      .set('x-admin-key', TEST_ADMIN_KEY);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
  });

  it('returns 404 for the generated render when none exists yet', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA.id}/images/generated`)
      .set('x-design-token', leadA.token);
    expect(res.status).toBe(404);
  });

  it('returns 404 for an unknown image kind even with a valid token', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA.id}/images/original`)
      .set('x-design-token', leadA.token);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/leads/:id/generation auth', () => {
  it('rejects a missing token', async () => {
    const res = await request(app).get(`/api/leads/${leadA.id}/generation`);
    expect(res.status).toBe(401);
  });

  it('rejects a garbage token', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA.id}/generation`)
      .set('x-design-token', 'not-a-real-token');
    expect(res.status).toBe(401);
  });

  it("rejects another lead's valid token", async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA.id}/generation`)
      .set('x-design-token', leadB.token);
    expect(res.status).toBe(401);
  });

  it('returns the generation state only to the owning token', async () => {
    const res = await request(app)
      .get(`/api/leads/${leadA.id}/generation`)
      .set('x-design-token', leadA.token);
    expect(res.status).toBe(200);
    expect(res.body.leadId).toBe(leadA.id);
    expect(res.body.sourceImageUrl).toBe(`/api/leads/${leadA.id}/images/source`);
    // The customer projection must never leak credentials or raw paths.
    const raw = JSON.stringify(res.body);
    expect(raw).not.toContain('accessTokenHash');
    expect(raw).not.toContain('/objects/');
  });
});

describe('lead-id probing is indistinguishable', () => {
  it('image endpoint: same error for existing and nonexistent ids without credentials', async () => {
    const existing = await request(app).get(
      `/api/leads/${leadA.id}/images/source`,
    );
    const missing = await request(app).get(
      `/api/leads/${NONEXISTENT_LEAD_ID}/images/source`,
    );
    expect(missing.status).toBe(existing.status);
    expect(missing.body).toEqual(existing.body);
  });

  it('image endpoint: same error for existing and nonexistent ids with a bad token', async () => {
    const existing = await request(app)
      .get(`/api/leads/${leadA.id}/images/source`)
      .set('x-design-token', 'not-a-real-token');
    const missing = await request(app)
      .get(`/api/leads/${NONEXISTENT_LEAD_ID}/images/source`)
      .set('x-design-token', 'not-a-real-token');
    expect(missing.status).toBe(existing.status);
    expect(missing.body).toEqual(existing.body);
  });

  it("image endpoint: same error probing a nonexistent id with someone else's valid token", async () => {
    const existing = await request(app)
      .get(`/api/leads/${leadA.id}/images/source`)
      .set('x-design-token', leadB.token);
    const missing = await request(app)
      .get(`/api/leads/${NONEXISTENT_LEAD_ID}/images/source`)
      .set('x-design-token', leadB.token);
    expect(missing.status).toBe(existing.status);
    expect(missing.body).toEqual(existing.body);
  });

  it('generation endpoint: same error for wrong token vs nonexistent lead', async () => {
    const existing = await request(app)
      .get(`/api/leads/${leadA.id}/generation`)
      .set('x-design-token', leadB.token);
    const missing = await request(app)
      .get(`/api/leads/${NONEXISTENT_LEAD_ID}/generation`)
      .set('x-design-token', leadB.token);
    expect(missing.status).toBe(existing.status);
    expect(missing.body).toEqual(existing.body);
  });

  it('generation start endpoint: same error for wrong token vs nonexistent lead', async () => {
    const existing = await request(app)
      .post(`/api/leads/${leadA.id}/generation`)
      .set('x-design-token', leadB.token);
    const missing = await request(app)
      .post(`/api/leads/${NONEXISTENT_LEAD_ID}/generation`)
      .set('x-design-token', leadB.token);
    expect(existing.status).toBe(401);
    expect(missing.status).toBe(existing.status);
    expect(missing.body).toEqual(existing.body);
  });
});

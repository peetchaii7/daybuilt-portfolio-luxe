/**
 * Integration tests for the Design Studio upload / lead pipeline.
 *
 * These run against the real development database and object storage, so any
 * refactor of storage.ts, leads.ts, uploadProof.ts or objectStorage.ts that
 * weakens a safeguard fails here before it ships:
 *  - forged upload proofs
 *  - wrong MIME types
 *  - declared/actual size mismatches
 *  - oversized bodies
 *  - arbitrary private object-path binding
 *  - duplicate lead submissions (concurrent)
 *  - generation claim concurrency (attempts increment exactly once)
 */
import { randomUUID } from 'node:crypto';
import { db, leadsTable } from '@workspace/db';
import { eq, inArray } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import app from '../app';
import { claimLeadForGeneration } from '../lib/generationService';
import { ObjectStorageService } from '../lib/objectStorage';
import { createUploadProof, MAX_UPLOAD_BYTES } from '../lib/uploadProof';

const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(120, 7),
]);

const createdLeadIds: number[] = [];
const uploadedObjectPaths: string[] = [];

function designRequestId(): string {
  return `test-${randomUUID()}${randomUUID()}`;
}

async function requestUploadUrl(overrides: Partial<{ size: number; contentType: string }> = {}) {
  const res = await request(app)
    .post('/api/storage/uploads/request-url')
    .send({
      name: 'room.png',
      size: PNG_BYTES.length,
      contentType: 'image/png',
      ...overrides,
    });
  return res;
}

/** Full happy-path upload; returns the proof and object path. */
async function uploadValidImage() {
  const urlRes = await requestUploadUrl();
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

function designStudioLeadBody(objectPath: string, uploadProof: string, reqId: string) {
  return {
    name: 'Test Customer',
    email: 'upload-security-test@example.com',
    source: 'design-studio',
    roomType: 'living-room',
    roomSize: '20 sqm',
    builtInType: 'tv-wall',
    style: 'Modern Luxury',
    colorTone: 'Warm Neutral',
    keepLayout: 'yes',
    timeline: '1-3 months',
    imageUrl: objectPath,
    designRequestId: reqId,
    uploadProof,
  };
}

beforeAll(() => {
  if (!process.env.SESSION_SECRET || !process.env.DATABASE_URL) {
    throw new Error('Tests require SESSION_SECRET and DATABASE_URL');
  }
});

afterAll(async () => {
  if (createdLeadIds.length > 0) {
    await db.delete(leadsTable).where(inArray(leadsTable.id, createdLeadIds));
  }

  // Delete every object the tests uploaded so runs don't accumulate
  // orphaned files in real object storage.
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

describe('upload URL request validation', () => {
  it('rejects oversized declared size', async () => {
    const res = await requestUploadUrl({ size: MAX_UPLOAD_BYTES + 1 });
    expect(res.status).toBe(400);
  });

  it('rejects disallowed content types', async () => {
    const res = await requestUploadUrl({ contentType: 'image/gif' });
    expect(res.status).toBe(400);
  });

  it('issues a proof bound to a fresh /objects/uploads/ path', async () => {
    const res = await requestUploadUrl();
    expect(res.status).toBe(200);
    expect(res.body.objectPath).toMatch(/^\/objects\/uploads\/[0-9a-f-]{36}$/);
    expect(typeof res.body.uploadProof).toBe('string');
  });
});

describe('PUT /api/storage/uploads', () => {
  it('accepts a valid upload matching the proof', async () => {
    await uploadValidImage();
  });

  it('rejects a missing token', async () => {
    const res = await request(app)
      .put('/api/storage/uploads')
      .set('content-type', 'image/png')
      .send(PNG_BYTES);
    expect(res.status).toBe(401);
  });

  it('rejects a forged (tampered) proof', async () => {
    const urlRes = await requestUploadUrl();
    const proof = urlRes.body.uploadProof as string;
    const [payload, signature] = proof.split('.');

    // Tamper the claims payload but keep the original signature.
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    claims.size = MAX_UPLOAD_BYTES;
    const forged = `${Buffer.from(JSON.stringify(claims)).toString('base64url')}.${signature}`;

    const res = await request(app)
      .put('/api/storage/uploads')
      .set('x-upload-token', forged)
      .set('content-type', 'image/png')
      .send(PNG_BYTES);
    expect(res.status).toBe(401);
  });

  it('rejects a proof bound to an arbitrary private object path', async () => {
    // Even a correctly signed proof must not escape /objects/uploads/.
    const proof = createUploadProof({
      objectPath: '/objects/design-studio/generated/1/render.png',
      size: PNG_BYTES.length,
      contentType: 'image/png',
    });
    const res = await request(app)
      .put('/api/storage/uploads')
      .set('x-upload-token', proof)
      .set('content-type', 'image/png')
      .send(PNG_BYTES);
    expect(res.status).toBe(401);
  });

  it('rejects a MIME type different from the proof', async () => {
    const urlRes = await requestUploadUrl();
    const res = await request(app)
      .put('/api/storage/uploads')
      .set('x-upload-token', urlRes.body.uploadProof)
      .set('content-type', 'image/jpeg')
      .send(PNG_BYTES);
    expect(res.status).toBe(400);
  });

  it('rejects a body whose size differs from the declared size', async () => {
    const urlRes = await requestUploadUrl({ size: PNG_BYTES.length + 10 });
    const res = await request(app)
      .put('/api/storage/uploads')
      .set('x-upload-token', urlRes.body.uploadProof)
      .set('content-type', 'image/png')
      .send(PNG_BYTES);
    expect(res.status).toBe(400);
  });

  it('rejects an oversized body outright', async () => {
    const urlRes = await requestUploadUrl();
    const res = await request(app)
      .put('/api/storage/uploads')
      .set('x-upload-token', urlRes.body.uploadProof)
      .set('content-type', 'image/png')
      .send(Buffer.alloc(MAX_UPLOAD_BYTES + 1, 1));
    expect(res.status).toBe(413);
  });
});

describe('POST /api/leads (design-studio)', () => {
  it('accepts a lead bound to a genuinely uploaded image', async () => {
    const { uploadProof, objectPath } = await uploadValidImage();
    const res = await request(app)
      .post('/api/leads')
      .send(designStudioLeadBody(objectPath, uploadProof, designRequestId()));
    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('number');
    expect(typeof res.body.accessToken).toBe('string');
    createdLeadIds.push(res.body.id);
  });

  it('rejects a proof bound to a different object path than imageUrl', async () => {
    const { uploadProof } = await uploadValidImage();
    const otherPath = `/objects/uploads/${randomUUID()}`;
    const res = await request(app)
      .post('/api/leads')
      .send(designStudioLeadBody(otherPath, uploadProof, designRequestId()));
    expect(res.status).toBe(400);
  });

  it('rejects a proof whose object was never actually uploaded', async () => {
    const urlRes = await requestUploadUrl();
    const res = await request(app)
      .post('/api/leads')
      .send(
        designStudioLeadBody(
          urlRes.body.objectPath,
          urlRes.body.uploadProof,
          designRequestId(),
        ),
      );
    expect(res.status).toBe(400);
  });

  it('rejects a forged proof', async () => {
    const { objectPath } = await uploadValidImage();
    const res = await request(app)
      .post('/api/leads')
      .send(designStudioLeadBody(objectPath, `${'a'.repeat(40)}.${'b'.repeat(43)}`, designRequestId()));
    expect(res.status).toBe(400);
  });

  it('rejects an unknown layout mode at the API boundary', async () => {
    const { uploadProof, objectPath } = await uploadValidImage();
    const res = await request(app)
      .post('/api/leads')
      .send({
        ...designStudioLeadBody(objectPath, uploadProof, designRequestId()),
        keepLayout: 'sometimes',
      });
    expect(res.status).toBe(400);
  });

  it('returns the same lead id and credential for concurrent duplicates, one row only', async () => {
    const { uploadProof, objectPath } = await uploadValidImage();
    const reqId = designRequestId();
    const body = designStudioLeadBody(objectPath, uploadProof, reqId);

    const [a, b] = await Promise.all([
      request(app).post('/api/leads').send(body),
      request(app).post('/api/leads').send(body),
    ]);

    expect([200, 201]).toContain(a.status);
    expect([200, 201]).toContain(b.status);
    expect(a.body.id).toBe(b.body.id);
    expect(a.body.accessToken).toBe(b.body.accessToken);
    createdLeadIds.push(a.body.id);

    // Exactly one row exists for this request id.
    const rows = await db
      .select({ id: leadsTable.id })
      .from(leadsTable)
      .where(eq(leadsTable.id, a.body.id));
    expect(rows).toHaveLength(1);

    const all = await db
      .select({ id: leadsTable.id, hash: leadsTable.designRequestHash })
      .from(leadsTable)
      .where(eq(leadsTable.email, 'upload-security-test@example.com'));
    const sameHash = all.filter((r) => r.hash !== null);
    const uniqueHashes = new Set(sameHash.map((r) => r.hash));
    expect(uniqueHashes.size).toBe(sameHash.length);
  });
});

describe('generation claim concurrency', () => {
  it('increments attempts exactly once when two claims race', async () => {
    const [lead] = await db
      .insert(leadsTable)
      .values({
        name: 'Claim Race',
        email: 'upload-security-test@example.com',
        source: 'design-studio',
        aiStatus: 'pending',
        aiAttempts: 0,
      })
      .returning({ id: leadsTable.id });
    createdLeadIds.push(lead.id);

    const [r1, r2] = await Promise.all([
      claimLeadForGeneration(lead.id, 'start'),
      claimLeadForGeneration(lead.id, 'start'),
    ]);

    const claims = [r1, r2].filter((r) => r?.claimed);
    expect(claims).toHaveLength(1);

    const [row] = await db
      .select({ attempts: leadsTable.aiAttempts, status: leadsTable.aiStatus })
      .from(leadsTable)
      .where(eq(leadsTable.id, lead.id));
    expect(row.attempts).toBe(1);
    expect(row.status).toBe('processing');
  });
});

describe('private object route', () => {
  it('never serves private objects anonymously', async () => {
    const res = await request(app).get(
      '/api/storage/objects/uploads/whatever',
    );
    expect(res.status).toBe(404);
  });
});

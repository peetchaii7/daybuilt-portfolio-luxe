import { Readable } from 'stream';
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from '@workspace/api-zod';
import {
  raw,
  Router,
  type IRouter,
  type Request,
  type Response,
} from 'express';

import { ObjectStorageService } from '../lib/objectStorage';
import {
  createUploadProof,
  isUploadProofConfigured,
  MAX_UPLOAD_BYTES,
  verifyUploadProof,
} from '../lib/uploadProof';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 *
 * Design Studio customers are anonymous, so this write path stays public. It is
 * kept safe by tight validation (jpg/png/webp only, <= 10MB) and by the short
 * 15-minute TTL on the signed URL. Reads of the resulting object are NOT
 * public — see GET /leads/:id/images/:kind.
 */
router.post(
  '/storage/uploads/request-url',
  async (req: Request, res: Response) => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      req.log.warn(
        { issues: parsed.error.issues.length },
        'Rejected upload URL request',
      );
      res.status(400).json({
        error:
          'Invalid upload request: only JPG, PNG or WebP images up to 10MB are allowed',
      });
      return;
    }

    try {
      const { name, size, contentType } = parsed.data;

      if (!isUploadProofConfigured()) {
        req.log.error('SESSION_SECRET is not configured; refusing upload');
        res.status(503).json({ error: 'Upload service is not configured' });
        return;
      }
      const objectPath = objectStorageService.createCustomerUploadPath();
      const uploadProof = createUploadProof({
        objectPath,
        size,
        contentType,
      });

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL: '/api/storage/uploads',
          objectPath,
          uploadToken: uploadProof,
          uploadProof,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  },
);

router.put(
  '/storage/uploads',
  raw({ type: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], limit: MAX_UPLOAD_BYTES }),
  async (req: Request, res: Response) => {
    const proof = verifyUploadProof(req.headers['x-upload-token']);
    if (!proof) {
      res.status(401).json({ error: 'Invalid or expired upload token' });
      return;
    }
    const requestType = String(req.headers['content-type'] ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase();
    if (requestType !== proof.contentType || !Buffer.isBuffer(req.body)) {
      res.status(400).json({ error: 'Upload metadata does not match' });
      return;
    }
    try {
      await objectStorageService.uploadCustomerObject(proof, req.body);
      res.status(204).end();
    } catch {
      res.status(400).json({ error: 'Invalid image upload' });
    }
  },
);

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const response = await objectStorageService.downloadObject(file);

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'Failed to serve public object' });
    }
  },
);

/**
 * GET /storage/objects/*
 *
 * Private objects are NEVER served from this generic route. Customer room
 * photos and AI renders live in PRIVATE_OBJECT_DIR and are only readable via
 * GET /leads/:id/images/:kind, which requires the customer design token or the
 * admin key. Anonymous reads here always 404 so the route cannot be used to
 * enumerate or exfiltrate uploads.
 */
router.get('/storage/objects/*path', (req: Request, res: Response) => {
  req.log.warn('Blocked unauthenticated private object read');
  res.status(404).json({ error: 'Object not found' });
});

export default router;

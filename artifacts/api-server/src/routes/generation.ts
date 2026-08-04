import { Readable } from 'node:stream';
import {
  GetLeadGenerationParams,
  GetLeadGenerationResponse,
  GetLeadImageParams,
  RetryLeadGenerationParams,
  RetryLeadGenerationResponse,
  StartLeadGenerationParams,
  StartLeadGenerationResponse,
} from '@workspace/api-zod';
import type { Lead } from '@workspace/db';
import { Router, type IRouter, type Request, type Response } from 'express';

import { checkAdminAuth, isValidAdminKey } from '../lib/adminAuth';
import {
  claimLeadForGeneration,
  getLeadById,
  isGenerationConfigured,
  runGeneration,
} from '../lib/generationService';
import {
  readDesignTokenHeader,
  verifyLeadAccessToken,
} from '../lib/leadAccessToken';
import {
  isAllowedImageContentType,
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';
import { recordFailedAuthAttempt } from '../lib/failedAuthRateLimit';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

type AiStatusValue = 'pending' | 'processing' | 'completed' | 'failed';

function normalizeStatus(value: string | null | undefined): AiStatusValue {
  switch (value) {
    case 'processing':
    case 'completed':
    case 'failed':
      return value;
    default:
      return 'pending';
  }
}

/**
 * Customer-facing projection. Deliberately omits the access token hash, the
 * exact prompt, raw object storage paths and admin diagnostics.
 */
function buildCustomerPayload(lead: Lead) {
  const status = normalizeStatus(lead.aiStatus);
  return {
    leadId: lead.id,
    status,
    conceptSummary: lead.aiPromptSummary ?? null,
    generatedImageUrl:
      status === 'completed' && lead.aiImagePath
        ? `/api/leads/${lead.id}/images/generated`
        : null,
    sourceImageUrl: lead.imageUrl ? `/api/leads/${lead.id}/images/source` : null,
    error: lead.aiError ?? null,
    attempts: lead.aiAttempts ?? 0,
    startedAt: lead.aiStartedAt ?? null,
    completedAt: lead.aiCompletedAt ?? null,
    updatedAt: lead.aiUpdatedAt ?? null,
    selections: {
      roomType: lead.roomType ?? null,
      roomSize: lead.roomSize ?? null,
      builtInType: lead.builtInType ?? null,
      style: lead.style ?? null,
      colorTone: lead.colorTone ?? null,
      keepLayout: lead.keepLayout ?? null,
      timeline: lead.timeline ?? null,
      budgetMin: lead.budgetMin ?? null,
      budgetMax: lead.budgetMax ?? null,
      description: lead.description ?? null,
    },
  };
}

function toCustomerResponse(lead: Lead) {
  return GetLeadGenerationResponse.parse(buildCustomerPayload(lead));
}

function toStartResponse(lead: Lead) {
  return StartLeadGenerationResponse.parse(buildCustomerPayload(lead));
}

/** Admin projection: includes diagnostics but still no raw object paths. */
function toAdminResponse(lead: Lead) {
  const status = normalizeStatus(lead.aiStatus);
  return RetryLeadGenerationResponse.parse({
    leadId: lead.id,
    status,
    conceptSummary: lead.aiPromptSummary ?? null,
    generatedImageUrl:
      status === 'completed' && lead.aiImagePath
        ? `/api/leads/${lead.id}/images/generated`
        : null,
    sourceImageUrl: lead.imageUrl ? `/api/leads/${lead.id}/images/source` : null,
    error: lead.aiError ?? null,
    errorDetail: lead.aiErrorDetail ?? null,
    provider: lead.aiProvider ?? null,
    model: lead.aiModel ?? null,
    attempts: lead.aiAttempts ?? 0,
    startedAt: lead.aiStartedAt ?? null,
    completedAt: lead.aiCompletedAt ?? null,
    updatedAt: lead.aiUpdatedAt ?? null,
  });
}

type CustomerAuth =
  | { ok: true; lead: Lead }
  | {
      ok: false;
      status: 400 | 401 | 404 | 429;
      error: string;
      retryAfterSeconds?: number;
    };

function failedCustomerAuth(
  req: Request,
  error: string,
): Extract<CustomerAuth, { ok: false }> {
  const decision = recordFailedAuthAttempt(req);
  if (!decision.allowed) {
    return {
      ok: false,
      status: 429,
      error: `Too many failed access attempts. Retry after ${decision.retryAfterSeconds} seconds.`,
      retryAfterSeconds: decision.retryAfterSeconds,
    };
  }
  return { ok: false, status: 401, error };
}

function sendCustomerAuthError(
  response: Response,
  auth: Extract<CustomerAuth, { ok: false }>,
): void {
  if (auth.status === 429 && auth.retryAfterSeconds) {
    response.setHeader('Retry-After', String(auth.retryAfterSeconds));
  }
  response.status(auth.status).json({ error: auth.error });
}

async function authenticateCustomer(
  req: Request,
  rawId: unknown,
): Promise<CustomerAuth> {
  const parsedParams = StartLeadGenerationParams.safeParse({ id: rawId });
  if (!parsedParams.success) {
    return { ok: false, status: 400, error: 'Invalid lead id' };
  }

  const token = readDesignTokenHeader(
    req.headers as { 'x-design-token'?: string | string[] },
  );
  if (!token) {
    return failedCustomerAuth(req, 'Missing access token');
  }

  const lead = await getLeadById(parsedParams.data.id);
  if (!lead || !verifyLeadAccessToken(token, lead.accessTokenHash)) {
    // Identical response for a nonexistent lead and a wrong token so the
    // endpoint cannot be used to probe which lead ids exist.
    return failedCustomerAuth(req, 'Invalid access token');
  }

  return { ok: true, lead };
}

/**
 * POST /leads/:id/generation — start the AI render (customer token).
 *
 * Generation runs inline: the response is emitted only after the terminal
 * state is persisted, so a restart cannot orphan work.
 */
router.post('/leads/:id/generation', async (req: Request, res: Response) => {
  const auth = await authenticateCustomer(req, req.params.id);
  if (!auth.ok) {
    sendCustomerAuthError(res, auth);
    return;
  }

  const lead = auth.lead;

  if (lead.source !== 'design-studio') {
    res
      .status(400)
      .json({ error: 'This lead does not support AI design generation' });
    return;
  }

  if (!lead.imageUrl) {
    res.status(400).json({ error: 'This lead has no uploaded room photo' });
    return;
  }

  if (!isGenerationConfigured()) {
    req.log.error('AI integration env vars are missing; refusing generation');
    res
      .status(503)
      .json({ error: 'AI design generation is not configured on this server' });
    return;
  }

  const claim = await claimLeadForGeneration(lead.id, 'start');
  if (!claim) {
    res.status(404).json({ error: 'Lead not found' });
    return;
  }

  if (!claim.claimed) {
    const status = normalizeStatus(claim.lead.aiStatus);
    // Already completed → return the existing state; already running → 409.
    if (status === "completed") {
      res.status(200).json(toStartResponse(claim.lead));
      return;
    }
    res.status(409).json(toStartResponse(claim.lead));
    return;
  }

  req.log.info({ leadId: lead.id }, 'Starting design generation');
  const result = await runGeneration(claim.lead, req.log);
  res.status(200).json(toStartResponse(result.lead));
});

/** GET /leads/:id/generation — poll the render state (customer token). */
router.get('/leads/:id/generation', async (req: Request, res: Response) => {
  const parsedParams = GetLeadGenerationParams.safeParse({ id: req.params.id });
  if (!parsedParams.success) {
    res.status(400).json({ error: 'Invalid lead id' });
    return;
  }

  const auth = await authenticateCustomer(req, req.params.id);
  if (!auth.ok) {
    sendCustomerAuthError(res, auth);
    return;
  }

  res.status(200).json(toCustomerResponse(auth.lead));
});

/**
 * POST /leads/:id/generation/retry — admin retry of a failed or stale run.
 */
router.post(
  '/leads/:id/generation/retry',
  async (req: Request, res: Response) => {
    const admin = checkAdminAuth(req);
    if (!admin.ok) {
      if (admin.status === 503) {
        req.log.error('ADMIN_KEY is not configured; refusing admin retry');
      }
      res.status(admin.status).json({ error: admin.error });
      return;
    }

    const parsedParams = RetryLeadGenerationParams.safeParse({
      id: req.params.id,
    });
    if (!parsedParams.success) {
      res.status(400).json({ error: 'Invalid lead id' });
      return;
    }

    if (!isGenerationConfigured()) {
      req.log.error('AI integration env vars are missing; refusing retry');
      res.status(503).json({
        error: 'AI design generation is not configured on this server',
      });
      return;
    }

    const existing = await getLeadById(parsedParams.data.id);
    if (!existing) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (existing.source !== 'design-studio' || !existing.imageUrl) {
      res
        .status(409)
        .json(toAdminResponse(existing));
      return;
    }

    const claim = await claimLeadForGeneration(existing.id, 'retry');
    if (!claim) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }
    if (!claim.claimed) {
      // completed, pending, or a processing run that is not yet stale
      res.status(409).json(toAdminResponse(claim.lead));
      return;
    }

    req.log.info({ leadId: existing.id }, 'Admin retry of design generation');
    const result = await runGeneration(claim.lead, req.log);
    res.status(200).json(toAdminResponse(result.lead));
  },
);

/**
 * GET /leads/:id/images/:kind — the only way private lead images are served.
 * Accepts the customer design token or the admin key.
 */
router.get('/leads/:id/images/:kind', async (req: Request, res: Response) => {
  const parsedParams = GetLeadImageParams.safeParse({
    id: req.params.id,
    kind: req.params.kind,
  });
  if (!parsedParams.success) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  const { id, kind } = parsedParams.data;

  const lead = await getLeadById(id);

  const token = readDesignTokenHeader(
    req.headers as { 'x-design-token'?: string | string[] },
  );
  const customerOk =
    token && lead ? verifyLeadAccessToken(token, lead.accessTokenHash) : false;
  const adminOk = isValidAdminKey(req.headers['x-admin-key']);

  // Auth is checked before lead existence so an unauthenticated caller gets
  // the same 401 whether or not the lead id exists (no id probing).
  if (!customerOk && !adminOk) {
    const decision = recordFailedAuthAttempt(req);
    if (!decision.allowed) {
      res
        .status(429)
        .setHeader('Retry-After', String(decision.retryAfterSeconds))
        .json({
          error: `Too many failed access attempts. Retry after ${decision.retryAfterSeconds} seconds.`,
        });
      return;
    }
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!lead) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  const objectPath = kind === 'generated' ? lead.aiImagePath : lead.imageUrl;
  if (!objectPath) {
    res.status(404).json({ error: 'Image not found' });
    return;
  }

  try {
    const file = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(file);
    const contentType = response.headers.get('content-type');

    if (!isAllowedImageContentType(contentType)) {
      req.log.warn(
        { leadId: lead.id, kind },
        'Refusing to serve lead image with unsupported content type',
      );
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    res.status(200);
    res.setHeader('Content-Type', contentType as string);
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    if (response.body) {
      Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }
    req.log.error(
      { leadId: lead.id, kind, err: error },
      'Failed to serve lead image',
    );
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

export default router;

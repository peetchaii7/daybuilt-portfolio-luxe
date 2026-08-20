import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { db, leadsTable, type Lead } from '@workspace/db';
import { and, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import type { Logger } from 'pino';

import { buildDesignPrompt, buildPromptSummary } from './designPrompt';
import { buildImageEditOptions } from './imageEditOptions';
import {
  isAllowedImageContentType,
  ObjectStorageService,
} from './objectStorage';
import {
  prepareRoomImage,
  restoreRoomAspectRatio,
} from './roomImageGeometry';

export const GENERATION_TIMEOUT_MS = 120_000;
export const GENERATION_PROVIDER = 'openai';
export const GENERATION_MODEL = 'gpt-image-1';

export { buildImageEditOptions } from './imageEditOptions';

/** Customer-safe error copy. Never contains diagnostics. */
const CUSTOMER_ERROR_TIMEOUT =
  'การสร้างภาพใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง';
const CUSTOMER_ERROR_GENERIC =
  'ไม่สามารถสร้างภาพดีไซน์ได้ในขณะนี้ ทีมงานจะติดต่อกลับพร้อมแบบให้คุณ';

const objectStorageService = new ObjectStorageService();

export type ClaimReason = 'start' | 'retry';

export type ClaimResult =
  | { claimed: true; lead: Lead }
  | { claimed: false; lead: Lead };

/**
 * Atomically move a lead from a claimable state into `processing`.
 *
 * This is the only duplicate-prevention mechanism: the conditional UPDATE is a
 * single statement, so exactly one concurrent request can win the row.
 */
export async function claimLeadForGeneration(
  leadId: number,
  reason: ClaimReason,
): Promise<ClaimResult | null> {
  const now = new Date();
  const staleBefore = new Date(now.getTime() - GENERATION_TIMEOUT_MS);

  const claimableCondition =
    reason === 'start'
      ? or(
          isNull(leadsTable.aiStatus),
          inArray(leadsTable.aiStatus, ['pending', 'failed']),
        )
      : or(
          eq(leadsTable.aiStatus, 'failed'),
          // A processing run older than the timeout can never complete: the
          // request that owned it is gone.
          and(
            eq(leadsTable.aiStatus, 'processing'),
            or(
              isNull(leadsTable.aiStartedAt),
              lt(leadsTable.aiStartedAt, staleBefore),
            ),
          ),
        );

  const [claimed] = await db
    .update(leadsTable)
    .set({
      aiStatus: 'processing',
      aiStartedAt: now,
      aiCompletedAt: null,
      aiUpdatedAt: now,
      aiError: null,
      aiErrorDetail: null,
      aiAttempts: sql`${leadsTable.aiAttempts} + 1`,
    })
    .where(and(eq(leadsTable.id, leadId), claimableCondition))
    .returning();

  if (claimed) {
    return { claimed: true, lead: claimed };
  }

  const [existing] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, leadId));

  if (!existing) {
    return null;
  }
  return { claimed: false, lead: existing };
}

export async function getLeadById(leadId: number): Promise<Lead | null> {
  const [lead] = await db
    .select()
    .from(leadsTable)
    .where(eq(leadsTable.id, leadId));
  return lead ?? null;
}

async function persistFailure(
  leadId: number,
  safeError: string,
  adminDetail: string,
  prompt?: { exact: string; summary: string },
): Promise<Lead | null> {
  const now = new Date();
  const [updated] = await db
    .update(leadsTable)
    .set({
      aiStatus: 'failed',
      aiError: safeError,
      aiErrorDetail: adminDetail.slice(0, 2000),
      // A failed run must never leave a stale result behind.
      aiImagePath: null,
      aiCompletedAt: now,
      aiUpdatedAt: now,
      ...(prompt
        ? {
            aiPrompt: prompt.exact,
            aiPromptSummary: prompt.summary,
            aiProvider: GENERATION_PROVIDER,
            aiModel: GENERATION_MODEL,
          }
        : {}),
    })
    .where(eq(leadsTable.id, leadId))
    .returning();
  return updated ?? null;
}

function describeError(err: unknown): string {
  if (err instanceof Error) {
    return `${err.name}: ${err.message}`;
  }
  return String(err);
}

/**
 * Race a promise against a deadline. `editImages` has no AbortSignal support,
 * so the losing work is abandoned while the caller persists a failed state.
 */
function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error('GENERATION_TIMEOUT'));
    }, timeoutMs);
  });

  return Promise.race([work, deadline]).finally(() => {
    if (timer) {
      clearTimeout(timer);
    }
  }) as Promise<T>;
}

export function isGenerationConfigured(): boolean {
  return Boolean(
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL &&
      process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  );
}

export interface RunGenerationResult {
  lead: Lead;
  ok: boolean;
}

/**
 * Run the full generation pipeline for a lead already claimed as `processing`.
 *
 * Runs inline in the request lifecycle so a server restart can never orphan a
 * detached promise: every state transition is persisted before the handler
 * responds, and a killed process leaves a `processing` row that admin retry
 * can reclaim once it goes stale.
 */
export async function runGeneration(
  lead: Lead,
  log: Logger,
): Promise<RunGenerationResult> {
  if (!isGenerationConfigured()) {
    const failed = await persistFailure(
      lead.id,
      CUSTOMER_ERROR_GENERIC,
      'AI integration is not configured (missing AI_INTEGRATIONS_OPENAI_* env vars)',
    );
    return { lead: failed ?? lead, ok: false };
  }

  if (!lead.imageUrl) {
    const failed = await persistFailure(
      lead.id,
      CUSTOMER_ERROR_GENERIC,
      'Lead has no uploaded source image',
    );
    return { lead: failed ?? lead, ok: false };
  }

  const prompt = buildDesignPrompt(lead);
  const promptSummary = buildPromptSummary(lead);

  let tempDir: string | null = null;

  try {
    // 1. Pull the customer's photo out of private storage into a temp file.
    const { buffer: sourceBuffer, contentType } =
      await objectStorageService.downloadObjectBuffer(lead.imageUrl);

    if (sourceBuffer.length === 0) {
      throw new Error('Source image is empty');
    }
    if (!isAllowedImageContentType(contentType)) {
      throw new Error(`Unsupported source content type: ${contentType}`);
    }

    const { buffer: preparedSource, plan } =
      await prepareRoomImage(sourceBuffer);
    tempDir = await mkdtemp(join(tmpdir(), 'daybuilt-gen-'));
    const sourcePath = join(tempDir, `${randomUUID()}.png`);
    await writeFile(sourcePath, preparedSource, { mode: 0o600 });

    // 2. Ask the managed OpenAI integration to edit the photo. Imported
    // lazily so a missing integration cannot crash server startup.
    const { editImages } = await import(
      '@workspace/integrations-openai-ai-server/image'
    );

    const generatedCanvas = await withTimeout(
      editImages([sourcePath], prompt, undefined, {
        ...buildImageEditOptions(lead.keepLayout, plan.providerSize),
      }),
      GENERATION_TIMEOUT_MS,
    );

    if (!generatedCanvas || generatedCanvas.length === 0) {
      throw new Error('Image model returned an empty result');
    }
    const generated = await restoreRoomAspectRatio(generatedCanvas, plan);

    // 3. Store the render privately; only the lead image endpoint serves it.
    const generatedPath = await objectStorageService.uploadObjectBuffer({
      buffer: generated,
      contentType: 'image/png',
      keyPrefix: `design-studio/generated/${lead.id}`,
      extension: 'png',
    });

    const now = new Date();
    const [updated] = await db
      .update(leadsTable)
      .set({
        aiStatus: 'completed',
        aiPrompt: prompt,
        aiPromptSummary: promptSummary,
        aiImagePath: generatedPath,
        aiProvider: GENERATION_PROVIDER,
        aiModel: GENERATION_MODEL,
        aiError: null,
        aiErrorDetail: null,
        aiCompletedAt: now,
        aiUpdatedAt: now,
      })
      .where(eq(leadsTable.id, lead.id))
      .returning();

    log.info(
      { leadId: lead.id, bytes: generated.length },
      'Design generation completed',
    );

    return { lead: updated ?? lead, ok: true };
  } catch (err) {
    const timedOut = err instanceof Error && err.message === 'GENERATION_TIMEOUT';
    const safeError = timedOut
      ? CUSTOMER_ERROR_TIMEOUT
      : CUSTOMER_ERROR_GENERIC;

    // Only the lead id and a scrubbed error shape are logged: never the
    // prompt, contact details, tokens or object paths.
    log.error(
      { leadId: lead.id, timedOut, reason: describeError(err) },
      'Design generation failed',
    );

    // Keep the prompt/summary for admin diagnostics even on failure.
    const failed = await persistFailure(lead.id, safeError, describeError(err), {
      exact: prompt,
      summary: promptSummary,
    });

    return { lead: failed ?? lead, ok: false };
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {
        // Temp cleanup is best effort; the OS reclaims tmpdir anyway.
      });
    }
  }
}

import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Admin key comes exclusively from the environment. There is deliberately no
 * hardcoded fallback: an unset ADMIN_KEY means the admin surface is disabled.
 */
export function getAdminKey(): string | null {
  const key = process.env.ADMIN_KEY;
  if (!key || key.trim().length === 0) {
    return null;
  }
  return key;
}

export function isAdminConfigured(): boolean {
  return getAdminKey() !== null;
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/**
 * Constant-time comparison of the supplied header against the configured key.
 * Both sides are hashed first so lengths always match.
 */
export function isValidAdminKey(supplied: unknown): boolean {
  const expected = getAdminKey();
  if (expected === null) {
    return false;
  }
  if (typeof supplied !== 'string' || supplied.length === 0) {
    return false;
  }
  return timingSafeEqual(sha256(supplied), sha256(expected));
}

export type AdminAuthResult =
  | { ok: true }
  | { ok: false; status: 503 | 401; error: string };

export function checkAdminAuth(req: Request): AdminAuthResult {
  if (!isAdminConfigured()) {
    return {
      ok: false,
      status: 503,
      error: 'Admin access is not configured on this server',
    };
  }
  if (!isValidAdminKey(req.headers['x-admin-key'])) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
  return { ok: true };
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = checkAdminAuth(req);
  if (!result.ok) {
    if (result.status === 503) {
      req.log.error('ADMIN_KEY is not configured; refusing admin request');
    }
    res.status(result.status).json({ error: result.error });
    return;
  }
  next();
}

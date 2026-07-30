import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Anonymous customer access token for Design Studio leads.
 *
 * The raw token is generated once, returned once from POST /leads, and never
 * persisted or logged. Only its SHA-256 hash is stored.
 */
export function generateLeadAccessToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Deterministic, pseudorandom token for an idempotent Design Studio request.
 * The same client request id can safely receive the same token after a lost
 * response, while only its SHA-256 hash is persisted.
 */
export function deriveLeadAccessToken(requestId: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET is not configured');
  }
  return createHmac('sha256', secret)
    .update(`daybuilt-design:${requestId}`, 'utf8')
    .digest('base64url');
}

export function hashLeadAccessToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/**
 * Constant-time comparison of a supplied token against the stored hash.
 */
export function verifyLeadAccessToken(
  supplied: unknown,
  storedHash: string | null | undefined,
): boolean {
  if (!storedHash) {
    return false;
  }
  if (typeof supplied !== 'string' || supplied.length === 0) {
    return false;
  }

  const suppliedHash = hashLeadAccessToken(supplied);
  const a = Buffer.from(suppliedHash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length === 0 || a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

export function readDesignTokenHeader(headers: {
  'x-design-token'?: string | string[];
}): string | null {
  const raw = headers['x-design-token'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

import { createHmac, timingSafeEqual } from 'node:crypto';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const UPLOAD_PROOF_TTL_MS = 15 * 60 * 1000;

export interface UploadProofClaims {
  objectPath: string;
  size: number;
  contentType: string;
  expiresAt: number;
}

function getSigningSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  return secret && secret.length >= 16 ? secret : null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('base64url');
}

export function isUploadProofConfigured(): boolean {
  return getSigningSecret() !== null;
}

export function createUploadProof(
  input: Omit<UploadProofClaims, 'expiresAt'>,
): string {
  const secret = getSigningSecret();
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured');
  }
  const claims: UploadProofClaims = {
    ...input,
    expiresAt: Date.now() + UPLOAD_PROOF_TTL_MS,
  };
  const payload = Buffer.from(JSON.stringify(claims), 'utf8').toString(
    'base64url',
  );
  return `${payload}.${signPayload(payload, secret)}`;
}

export function verifyUploadProof(
  proof: unknown,
  expectedPath?: string,
): UploadProofClaims | null {
  const secret = getSigningSecret();
  if (!secret || typeof proof !== 'string') return null;
  const [payload, suppliedSignature, extra] = proof.split('.');
  if (!payload || !suppliedSignature || extra) return null;

  const expectedSignature = signPayload(payload, secret);
  const a = Buffer.from(suppliedSignature, 'base64url');
  const b = Buffer.from(expectedSignature, 'base64url');
  if (a.length === 0 || a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as UploadProofClaims;
    if (
      typeof claims.objectPath !== 'string' ||
      !claims.objectPath.startsWith('/objects/uploads/') ||
      typeof claims.size !== 'number' ||
      claims.size < 1 ||
      claims.size > MAX_UPLOAD_BYTES ||
      typeof claims.contentType !== 'string' ||
      typeof claims.expiresAt !== 'number' ||
      claims.expiresAt < Date.now() ||
      (expectedPath && claims.objectPath !== expectedPath)
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}
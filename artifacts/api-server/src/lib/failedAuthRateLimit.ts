export const FAILED_AUTH_MAX_FAILURES = 20;
export const FAILED_AUTH_WINDOW_MS = 60_000;
export const FAILED_AUTH_BLOCK_MS = 60_000;

type Clock = () => number;

interface FailureBucket {
  failures: number[];
  blockedUntil: number;
}

export interface FailedAuthDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

/**
 * Small per-process limiter for anonymous token probing.
 *
 * Only failed authentication attempts are recorded. A valid customer token is
 * always allowed through, even if the same IP previously triggered the limit.
 * This keeps normal generation polling working while slowing repeated guesses.
 */
export class FailedAuthRateLimiter {
  private readonly buckets = new Map<string, FailureBucket>();

  constructor(
    private readonly maxFailures = FAILED_AUTH_MAX_FAILURES,
    private readonly windowMs = FAILED_AUTH_WINDOW_MS,
    private readonly blockMs = FAILED_AUTH_BLOCK_MS,
    private readonly now: Clock = () => Date.now(),
  ) {}

  recordFailure(key: string): FailedAuthDecision {
    const now = this.now();
    const bucket = this.buckets.get(key) ?? { failures: [], blockedUntil: 0 };

    if (bucket.blockedUntil > now) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((bucket.blockedUntil - now) / 1000),
        ),
      };
    }

    bucket.failures = bucket.failures.filter(
      (timestamp) => timestamp > now - this.windowMs,
    );
    bucket.failures.push(now);

    if (bucket.failures.length > this.maxFailures) {
      bucket.blockedUntil = now + this.blockMs;
      bucket.failures = [];
      this.buckets.set(key, bucket);
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(this.blockMs / 1000),
      };
    }

    this.buckets.set(key, bucket);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  reset(): void {
    this.buckets.clear();
  }
}

export const failedAuthRateLimiter = new FailedAuthRateLimiter();

export function getClientAddress(request: {
  ip?: string;
  socket: { remoteAddress?: string };
}): string {
  return request.ip || request.socket.remoteAddress || 'unknown';
}

export function recordFailedAuthAttempt(request: {
  ip?: string;
  socket: { remoteAddress?: string };
}): FailedAuthDecision {
  return failedAuthRateLimiter.recordFailure(getClientAddress(request));
}

export function resetFailedAuthRateLimiter(): void {
  failedAuthRateLimiter.reset();
}
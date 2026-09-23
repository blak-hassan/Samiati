// src/lib/rateLimit.ts
// In-memory sliding-window rate limiter. Used as a fast pre-check before
// expensive work in Server Actions and Route Handlers. For production,
// replace the in-memory store with the Convex-backed limiter in
// convex/lib/rateLimit.ts (same `check` API) so limits survive deploys.
export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

interface Entry {
  count: number;
  windowStart: number;
}

const store = new Map<string, Entry>();

// Periodically evict stale entries so the map doesn't grow unbounded.
let lastCleanup = Date.now();
function cleanup(now: number) {
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now - entry.windowStart > 60_000) store.delete(key);
  }
}

export function rateLimitCheck(
  key: string,
  { windowMs, maxRequests }: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const entry = store.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  entry.count += 1;
  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - entry.windowStart),
    };
  }
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    retryAfterMs: 0,
  };
}

export function rateLimitReset(key: string): void {
  store.delete(key);
}
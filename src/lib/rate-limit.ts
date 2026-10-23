/**
 * Simple in-memory fixed-window rate limiter keyed by IP.
 * NOTE: On serverless platforms (e.g. Vercel) each instance has its own memory,
 * and instances are recycled, so this is best-effort only. Use a shared store
 * (e.g. Upstash Redis / Vercel KV) for strict limits.
 */
export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return function check(key: string, now = Date.now()): RateLimitResult {
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
    }
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      const resetAt = now + windowMs;
      hits.set(key, { count: 1, resetAt });
      return { ok: true, remaining: limit - 1, resetAt };
    }
    entry.count++;
    return { ok: entry.count <= limit, remaining: Math.max(0, limit - entry.count), resetAt: entry.resetAt };
  };
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

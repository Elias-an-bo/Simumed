type Bucket = { count: number; resetAt: number };

/**
 * Limitador em memória por chave (IP + ação). Em hospedagem serverless cada instância tem a sua memória,
 * então isto é uma barreira básica contra abuso — junto com o campo-isca dos formulários.
 */
export function createRateLimiter() {
  const buckets = new Map<string, Bucket>();
  return function allow(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
    const b = buckets.get(key);
    if (!b || now >= b.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      if (buckets.size > 5000) for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
      return true;
    }
    if (b.count >= limit) return false;
    b.count++;
    return true;
  };
}

export const rateLimit = createRateLimiter();

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-nf-client-connection-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

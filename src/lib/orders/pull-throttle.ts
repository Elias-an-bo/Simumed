/** Limita consultas diretas ao intermediador por pedido (fallback quando o webhook atrasa ou falha). */
export function createPullThrottle(intervalMs: number) {
  const last = new Map<string, number>();
  return (orderId: string, now = Date.now()): boolean => {
    const prev = last.get(orderId);
    if (prev !== undefined && now - prev < intervalMs) return false;
    last.set(orderId, now);
    if (last.size > 2000) for (const [k, v] of last) if (now - v > intervalMs) last.delete(k);
    return true;
  };
}

export const allowPaymentPull = createPullThrottle(15_000);

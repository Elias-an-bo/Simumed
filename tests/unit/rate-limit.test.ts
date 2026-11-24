import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/security/rate-limit";

describe("rate limit", () => {
  it("bloqueia a 6ª chamada dentro da janela com limite 5", () => {
    const limiter = createRateLimiter();
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) expect(limiter("ip1", 5, 60_000, now + i)).toBe(true);
    expect(limiter("ip1", 5, 60_000, now + 10)).toBe(false);
    expect(limiter("ip2", 5, 60_000, now + 10)).toBe(true);
  });
  it("libera de novo depois da janela", () => {
    const limiter = createRateLimiter();
    for (let i = 0; i < 5; i++) limiter("ip1", 5, 60_000, 0);
    expect(limiter("ip1", 5, 60_000, 60_001)).toBe(true);
  });
});

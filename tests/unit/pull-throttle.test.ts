import { describe, expect, it } from "vitest";
import { createPullThrottle } from "@/lib/orders/pull-throttle";

describe("createPullThrottle", () => {
  it("libera a primeira consulta e segura as seguintes por 15 s, por pedido", () => {
    const allow = createPullThrottle(15_000);
    expect(allow("o1", 0)).toBe(true);
    expect(allow("o1", 5_000)).toBe(false);
    expect(allow("o2", 5_000)).toBe(true);
    expect(allow("o1", 15_001)).toBe(true);
  });
});

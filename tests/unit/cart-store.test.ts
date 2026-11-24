import { describe, expect, it } from "vitest";
import { addLine, cartCount, removeLine, setLineQuantity, type CartLine } from "@/lib/cart/lines";

const item = (id: string, priceCents = 1000): Omit<CartLine, "quantity"> => ({
  productId: id, slug: id, name: `Produto ${id}`, priceCents, image: null, rootSlug: "simuladores", categoryName: "RCP",
});

describe("carrinho (linhas)", () => {
  it("adiciona e soma quantidade do mesmo produto", () => {
    let lines = addLine([], item("a"), 1);
    lines = addLine(lines, item("a"), 2);
    lines = addLine(lines, item("b"), 1);
    expect(lines.map((l) => [l.productId, l.quantity])).toEqual([["a", 3], ["b", 1]]);
    expect(cartCount(lines)).toBe(4);
  });
  it("limita quantidade entre 1 e 99", () => {
    expect(addLine([], item("a"), 500)[0].quantity).toBe(99);
    expect(addLine([], item("a"), 0)[0].quantity).toBe(1);
  });
  it("alterar para zero remove", () => {
    const lines = addLine([], item("a"), 2);
    expect(setLineQuantity(lines, "a", 0)).toEqual([]);
    expect(setLineQuantity(lines, "a", 5)[0].quantity).toBe(5);
  });
  it("remove linha", () => {
    expect(removeLine(addLine([], item("a"), 1), "a")).toEqual([]);
  });
});

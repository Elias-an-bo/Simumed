import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { recomputePrices } from "@/lib/catalog/reprice";

vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }));

describe("recomputePrices", () => {
  beforeEach(async () => {
    await prisma.orderEvent.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.settings.create({ data: { id: "default", defaultMarkupPercent: 40 } });
  });

  it("aplica produto > subcategoria > categoria > padrão e só altera o que mudou", async () => {
    const parent = await prisma.category.create({ data: { slug: "p", name: "P", markupPercent: 50 } });
    const child = await prisma.category.create({ data: { slug: "c", name: "C", parentId: parent.id } });
    const other = await prisma.category.create({ data: { slug: "o", name: "O" } });
    const base = { costCents: 100_000, priceCents: 1 };
    const a = await prisma.product.create({ data: { ...base, sku: "A", slug: "a", name: "A", categoryId: child.id } });
    const b = await prisma.product.create({ data: { ...base, sku: "B", slug: "b", name: "B", categoryId: child.id, markupPercent: 10 } });
    const c = await prisma.product.create({ data: { ...base, sku: "C", slug: "c", name: "C", categoryId: other.id } });

    const changed = await recomputePrices();
    expect(changed).toBe(3);
    const price = async (id: string) => (await prisma.product.findUniqueOrThrow({ where: { id } })).priceCents;
    expect(await price(a.id)).toBe(150_090); // herda 50% da categoria-mãe
    expect(await price(b.id)).toBe(110_090); // markup próprio
    expect(await price(c.id)).toBe(140_090); // padrão da loja

    await prisma.category.update({ where: { id: child.id }, data: { markupPercent: 30 } });
    expect(await recomputePrices()).toBe(1);
    expect(await price(a.id)).toBe(130_090);
    expect(await price(b.id)).toBe(110_090);
  });
});

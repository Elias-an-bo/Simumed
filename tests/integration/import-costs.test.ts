import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { importCosts } from "@/lib/catalog/import-costs";

vi.mock("react", async (orig) => ({ ...(await orig<typeof import("react")>()), cache: <T,>(fn: T) => fn }));

describe("importCosts", () => {
  beforeEach(async () => {
    await prisma.orderEvent.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.settings.deleteMany();
    await prisma.settings.create({ data: { id: "default", defaultMarkupPercent: 40 } });
    const cat = await prisma.category.create({ data: { slug: "x", name: "X" } });
    await prisma.product.create({ data: { sku: "SM-0001", slug: "a", name: "A", categoryId: cat.id } });
    await prisma.product.create({ data: { sku: "SM-0002", slug: "b", name: "B", categoryId: cat.id, costCents: 5000, priceCents: 7090 } });
  });

  it("atualiza custo e código do fornecedor por SKU e recalcula o preço", async () => {
    const r = await importCosts(JSON.stringify({ "SM-0001": { supplierCode: "XX1", costCents: 100_000, supplierUrl: "https://x" }, "SM-9999": { supplierCode: "Z", costCents: 1 } }));
    expect(r).toEqual({ updated: 1, unknown: 1, repriced: 1 });
    const a = await prisma.product.findUniqueOrThrow({ where: { sku: "SM-0001" } });
    expect(a).toMatchObject({ supplierCode: "XX1", costCents: 100_000, priceCents: 140_090 });
    const b = await prisma.product.findUniqueOrThrow({ where: { sku: "SM-0002" } });
    expect(b.costCents).toBe(5000);
  });

  it("rejeita arquivo inválido sem alterar nada", async () => {
    await expect(importCosts("não é json")).rejects.toThrow(/arquivo/i);
    await expect(importCosts(JSON.stringify({ "SM-0001": { costCents: -5 } }))).rejects.toThrow(/arquivo/i);
    expect((await prisma.product.findUniqueOrThrow({ where: { sku: "SM-0001" } })).costCents).toBe(0);
  });
});

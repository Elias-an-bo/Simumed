import { z } from "zod";
import { prisma } from "@/lib/db";
import { recomputePrices } from "./reprice";

const fileSchema = z.record(
  z.string().regex(/^SM-\d{4,}$/),
  z.object({ supplierCode: z.string().max(60).optional(), costCents: z.number().int().min(0).max(100_000_000), supplierUrl: z.string().nullable().optional() }),
);

/** Importa o arquivo privado de custos (gerado pelo catalog:import) para o banco e recalcula os preços. */
export async function importCosts(raw: string): Promise<{ updated: number; unknown: number; repriced: number }> {
  let data: z.infer<typeof fileSchema>;
  try {
    data = fileSchema.parse(JSON.parse(raw));
  } catch {
    throw new Error("Arquivo de custos inválido. Use o arquivo custos.json enviado pela Simumed.");
  }
  const skus = Object.keys(data);
  const existing = new Set((await prisma.product.findMany({ where: { sku: { in: skus } }, select: { sku: true } })).map((p) => p.sku));
  let updated = 0;
  for (const sku of skus) {
    if (!existing.has(sku)) continue;
    const row = data[sku];
    await prisma.product.update({ where: { sku }, data: { costCents: row.costCents, ...(row.supplierCode ? { supplierCode: row.supplierCode } : {}) } });
    updated++;
  }
  const repriced = await recomputePrices();
  return { updated, unknown: skus.length - updated, repriced };
}

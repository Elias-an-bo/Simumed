import { prisma } from "@/lib/db";

export async function categoryOptions() {
  const cats = await prisma.category.findMany({ include: { parent: true }, orderBy: [{ position: "asc" }, { name: "asc" }] });
  return cats
    .map((c) => ({ id: c.id, label: c.parent ? `${c.parent.name} › ${c.name}` : c.name, markup: c.markupPercent, parentMarkup: c.parent?.markupPercent ?? null }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export function centsToInput(c: number) {
  return (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

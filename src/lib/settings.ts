import { cache } from "react";
import { prisma } from "@/lib/db";

export const getSettings = cache(async () => {
  return prisma.settings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
});

export type StoreSettings = Awaited<ReturnType<typeof getSettings>>;

export function whatsappLink(whatsapp: string | null | undefined, text?: string): string | null {
  const digits = (whatsapp ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

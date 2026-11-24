import { z } from "zod";
import { isValidDocument, onlyDigits } from "@/lib/documents";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .optional()
    .transform((v) => (v ? v : undefined));

const itemsSchema = z
  .string()
  .optional()
  .transform((raw) => {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((i) => i && typeof i.productId === "string" && i.productId.length < 64)
        .slice(0, 100)
        .map((i) => ({ productId: i.productId as string, quantity: Math.min(999, Math.max(1, Math.floor(Number(i.quantity) || 1))) }));
    } catch {
      return [];
    }
  });

export const quoteInputSchema = z
  .object({
    type: z.enum(["PRODUCTS", "SOFTWARE", "MAINTENANCE", "CONTACT"]),
    name: z.string().trim().min(2, "Informe seu nome.").max(120, "Nome muito longo."),
    email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
    phone: z
      .string()
      .transform(onlyDigits)
      .refine((d) => d.length >= 10 && d.length <= 13, "Informe um telefone com DDD."),
    institution: optionalText(160),
    document: z
      .string()
      .optional()
      .transform((v) => (v && onlyDigits(v) ? onlyDigits(v) : undefined))
      .refine((v) => v === undefined || isValidDocument(v), "CPF ou CNPJ inválido."),
    city: optionalText(80),
    state: optionalText(2),
    message: optionalText(4000),
    equipment: optionalText(200),
    brandModel: optionalText(200),
    items: itemsSchema,
    website: z.string().max(0, "spam").optional(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "MAINTENANCE" && !v.equipment) {
      ctx.addIssue({ code: "custom", path: ["equipment"], message: "Informe qual equipamento precisa de manutenção." });
    }
    if ((v.type === "CONTACT" || v.type === "SOFTWARE") && !v.message) {
      ctx.addIssue({ code: "custom", path: ["message"], message: "Escreva sua mensagem." });
    }
  });

export type QuoteInput = z.output<typeof quoteInputSchema>;

export type ParseResult = { success: true; data: QuoteInput } | { success: false; errors: Record<string, string> };

export function parseQuoteInput(raw: Record<string, unknown>): ParseResult {
  const r = quoteInputSchema.safeParse(raw);
  if (r.success) return { success: true, data: r.data };
  const errors: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

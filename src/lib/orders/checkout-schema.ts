import { z } from "zod";
import { normalizeCep } from "@/lib/cep";
import { isValidDocument, onlyDigits } from "@/lib/documents";

const UF = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"] as const;
const text = (min: number, max: number, msg: string) => z.string().trim().min(min, msg).max(max, msg);

export const checkoutSchema = z.object({
  customer: z.object({
    name: text(5, 120, "Informe nome e sobrenome."),
    email: z.string().trim().toLowerCase().pipe(z.email("Informe um e-mail válido.")),
    phone: z.string().transform(onlyDigits).refine((d) => d.length >= 10 && d.length <= 11, "Informe um telefone com DDD."),
    document: z.string().transform(onlyDigits).refine(isValidDocument, "CPF ou CNPJ inválido."),
    companyName: z.string().trim().max(160).optional().transform((v) => v || undefined),
    stateRegistration: z.string().trim().max(30).optional().transform((v) => v || undefined),
  }),
  address: z.object({
    cep: z.string().transform((v) => normalizeCep(v) ?? "").refine((v) => v.length === 8, "CEP inválido."),
    street: text(2, 160, "Informe a rua."),
    number: text(1, 20, "Informe o número."),
    complement: z.string().trim().max(80).optional().transform((v) => v || undefined),
    district: text(2, 80, "Informe o bairro."),
    city: text(2, 80, "Informe a cidade."),
    state: z.string().trim().toUpperCase().refine((v) => (UF as readonly string[]).includes(v), "UF inválida."),
  }),
  items: z.array(z.object({ productId: z.string().max(64), quantity: z.number().int().min(1).max(99) })).min(1, "Carrinho vazio.").max(100),
  shippingOptionId: z.string().min(1, "Escolha o frete.").max(64),
  method: z.enum(["PIX", "CARD", "BOLETO"]),
  card: z
    .object({
      token: z.string().min(1).max(200),
      installments: z.number().int().min(1).max(24),
      paymentMethodId: z.string().min(1).max(40),
      issuerId: z.union([z.string(), z.number()]).optional().nullable().transform((v) => (v == null ? null : String(v))),
    })
    .optional(),
});

export type CheckoutInput = z.output<typeof checkoutSchema>;

export function checkoutErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

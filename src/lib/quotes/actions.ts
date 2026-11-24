"use server";

import { headers } from "next/headers";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { createQuote } from "./create-quote";
import { parseQuoteInput } from "./schema";

export type RequestState =
  | { status: "idle" }
  | { status: "error"; errors: Record<string, string>; values: Record<string, string> }
  | { status: "ok"; number: number };

export async function submitRequest(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const values: Record<string, string> = {};
  for (const [k, v] of formData.entries()) if (typeof v === "string" && !k.startsWith("$ACTION")) values[k] = v;

  const solutions = formData.getAll("solucoes").filter((v): v is string => typeof v === "string");
  if (solutions.length) {
    values.message = `Interesse: ${solutions.join(", ")}${values.message ? `\n\n${values.message}` : ""}`;
  }

  const ip = clientIp(await headers());
  if (!rateLimit(`quote:${ip}`, 5, 10 * 60_000)) {
    return { status: "error", errors: { form: "Muitas solicitações em pouco tempo. Aguarde alguns minutos e tente de novo." }, values };
  }

  const parsed = parseQuoteInput(values);
  if (!parsed.success) {
    if (parsed.errors.website) return { status: "ok", number: 0 }; // robô: finge sucesso
    return { status: "error", errors: parsed.errors, values };
  }
  try {
    const { number } = await createQuote(parsed.data);
    return { status: "ok", number };
  } catch (e) {
    console.error("[orcamento] erro ao registrar:", e);
    return { status: "error", errors: { form: "Não foi possível enviar agora. Tente novamente ou fale conosco pelo WhatsApp." }, values };
  }
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, RefreshCcw } from "lucide-react";
import { CardForm } from "./CardForm";

/** Atualiza a página quando o pagamento muda de status (Pix/boleto confirmados pelo webhook). */
export function OrderPoller({ id, token, status }: { id: string; token: string; status: string }) {
  const router = useRouter();
  useEffect(() => {
    if (status !== "PENDING_PAYMENT") return;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/pedidos/${id}/status?t=${token}`, { cache: "no-store" });
        const d = await r.json();
        if (d.status && d.status !== status) router.refresh();
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [id, token, status, router]);
  return null;
}

export function CopyButton({ text, label = "Copiar código Pix" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-primary w-full"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch {}
      }}
    >
      {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {copied ? "Código copiado!" : label}
    </button>
  );
}

export function RetryPayment({
  id, token, provider, publicKey, maxInstallments, email, totalWithoutDiscountCents, pixDiscountPercent,
}: {
  id: string; token: string; provider: string; publicKey: string | null; maxInstallments: number; email: string;
  totalWithoutDiscountCents: number; pixDiscountPercent: number;
}) {
  const router = useRouter();
  const [method, setMethod] = useState<"PIX" | "CARD" | "BOLETO" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(m: "PIX" | "CARD" | "BOLETO", card?: unknown) {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/pedidos/${id}/pagar`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ t: token, method: m, card }) });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Não foi possível gerar o pagamento.");
      else if (d.paymentMessage) setError(d.paymentMessage);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <p className="font-semibold text-ink">Tentar de novo com:</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => pay("PIX")}>
          {busy && method === "PIX" ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <RefreshCcw className="size-4" aria-hidden />} Pix{pixDiscountPercent > 0 ? ` (−${pixDiscountPercent}%)` : ""}
        </button>
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => setMethod("CARD")}>
          Outro cartão
        </button>
        <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => pay("BOLETO")}>
          Boleto
        </button>
      </div>
      {method === "CARD" && (
        <div className="mt-4">
          <CardForm provider={provider} publicKey={publicKey} amountCents={totalWithoutDiscountCents} maxInstallments={maxInstallments} email={email} disabled={busy} onSubmit={(card) => pay("CARD", card)} />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function FakePayButton({ id, token }: { id: string; token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn mt-3 w-full border border-dashed border-warn/60 text-sm text-warn"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await fetch("/api/dev/fake-pay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, t: token }) });
        router.refresh();
        setBusy(false);
      }}
    >
      Simular pagamento aprovado (ambiente de teste)
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react";
import { Loader2 } from "lucide-react";

export interface CardResult {
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId: string | null;
}

let initialized = false;

/** Formulário de cartão: Mercado Pago (Card Payment Brick) ou cartão de teste quando o provedor é "fake". */
export function CardForm({
  provider,
  publicKey,
  amountCents,
  maxInstallments,
  email,
  onSubmit,
  disabled,
}: {
  provider: string;
  publicKey: string | null;
  amountCents: number;
  maxInstallments: number;
  email: string;
  onSubmit: (card: CardResult) => Promise<void>;
  disabled?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [testInstallments, setTestInstallments] = useState(1);
  const [reject, setReject] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (provider === "mercadopago" && publicKey && !initialized) {
      initMercadoPago(publicKey, { locale: "pt-BR" });
      initialized = true;
    }
  }, [provider, publicKey]);

  if (provider !== "mercadopago") {
    return (
      <div className="rounded-[var(--radius-control)] border border-dashed border-warn/50 bg-warn-soft p-4">
        <p className="text-sm font-semibold text-warn">Ambiente de teste — nenhum cartão real é cobrado.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Parcelas{" "}
            <select className="field ml-1 h-9 min-h-0 w-auto py-0" value={testInstallments} onChange={(e) => setTestInstallments(Number(e.target.value))}>
              {Array.from({ length: maxInstallments }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}×
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reject} onChange={(e) => setReject(e.target.checked)} /> simular recusa
          </label>
          <button
            type="button"
            className="btn btn-primary ml-auto"
            disabled={disabled || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmit({ token: reject ? "recusar" : "teste-ok", installments: testInstallments, paymentMethodId: "visa", issuerId: null });
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />} Pagar com cartão de teste
          </button>
        </div>
      </div>
    );
  }

  if (!publicKey) return <p className="text-sm text-danger">Pagamento com cartão indisponível no momento.</p>;

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      {!ready && (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando formulário seguro de cartão…
        </p>
      )}
      <CardPayment
        key={amountCents}
        initialization={{ amount: amountCents / 100, payer: { email } }}
        customization={{ paymentMethods: { maxInstallments }, visual: { style: { theme: "default" } } }}
        locale="pt-BR"
        onReady={() => setReady(true)}
        onSubmit={async (data) => {
          await onSubmit({
            token: data.token,
            installments: Number(data.installments),
            paymentMethodId: data.payment_method_id,
            issuerId: data.issuer_id ? String(data.issuer_id) : null,
          });
        }}
      />
    </div>
  );
}

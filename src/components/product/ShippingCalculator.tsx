"use client";

import { useEffect, useState } from "react";
import { Loader2, Truck } from "lucide-react";
import { formatBRL } from "@/lib/money";

export interface ShippingOptionView {
  id: string;
  name: string;
  company: string;
  priceCents: number;
  days: number;
}

const CEP_KEY = "simumed:cep";

export function maskCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function ShippingCalculator({
  items,
  onSelect,
  selectedId,
  compact = false,
}: {
  items: { productId: string; quantity: number }[];
  onSelect?: (opt: ShippingOptionView | null, cep: string) => void;
  selectedId?: string | null;
  compact?: boolean;
}) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onRequest, setOnRequest] = useState(false);
  const [options, setOptions] = useState<ShippingOptionView[] | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CEP_KEY);
      if (saved) setCep(maskCep(saved));
    } catch {}
  }, []);

  async function calc(e?: React.FormEvent) {
    e?.preventDefault();
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Digite um CEP com 8 números.");
      return;
    }
    setLoading(true);
    setError(null);
    setOnRequest(false);
    setOptions(null);
    onSelect?.(null, digits);
    try {
      try {
        localStorage.setItem(CEP_KEY, digits);
      } catch {}
      const res = await fetch("/api/frete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cep: digits, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível calcular o frete agora.");
      if (data.onRequest) setOnRequest(true);
      else setOptions(data.options);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível calcular o frete agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={compact ? "" : "rounded-[var(--radius-card)] border border-line p-4"}>
      <form onSubmit={calc} className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="cep-frete" className="label flex items-center gap-2">
            <Truck className="size-4 text-brand" aria-hidden /> Calcular frete e prazo
          </label>
          <input
            id="cep-frete"
            className="field"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(maskCep(e.target.value))}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "cep-erro" : undefined}
          />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null} Calcular
        </button>
        <a
          href="https://buscacepinter.correios.com.br/app/endereco/index.php"
          target="_blank"
          rel="noopener"
          className="w-full text-xs text-muted underline"
        >
          Não sei meu CEP
        </a>
      </form>
      <div aria-live="polite">
        {error && (
          <p id="cep-erro" className="mt-3 text-sm text-danger">
            {error}
          </p>
        )}
        {onRequest && (
          <p className="mt-3 rounded-[var(--radius-control)] bg-warn-soft p-3 text-sm text-warn">
            Não conseguimos cotar a entrega automaticamente para este CEP. Solicite um orçamento que enviamos a melhor opção.
          </p>
        )}
        {options && (
          <ul className="mt-3 divide-y divide-line rounded-[var(--radius-control)] border border-line">
            {options.map((o) => {
              const selectable = !!onSelect;
              const content = (
                <>
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">{o.name}</span>
                    <span className="block text-sm text-muted">
                      {o.company} · até {o.days} {o.days === 1 ? "dia útil" : "dias úteis"}
                    </span>
                  </span>
                  <span className="num whitespace-nowrap font-semibold text-ink">{formatBRL(o.priceCents)}</span>
                </>
              );
              return (
                <li key={o.id}>
                  {selectable ? (
                    <label className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 ${selectedId === o.id ? "bg-brand-soft" : ""}`}>
                      <input
                        type="radio"
                        name="frete"
                        className="accent-[var(--color-brand)]"
                        checked={selectedId === o.id}
                        onChange={() => onSelect?.(o, cep.replace(/\D/g, ""))}
                      />
                      <span className="flex flex-1 items-center justify-between gap-3">{content}</span>
                    </label>
                  ) : (
                    <div className="flex items-center justify-between gap-3 px-3 py-2.5">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

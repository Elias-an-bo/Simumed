"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ShoppingCart, Trash2 } from "lucide-react";
import { submitRequest, type RequestState } from "@/lib/quotes/actions";
import { useCart } from "@/lib/cart/store";

type QuoteType = "PRODUCTS" | "SOFTWARE" | "MAINTENANCE" | "CONTACT";
export type RequestItem = { productId: string; name: string; quantity: number };

const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
const SOLUTIONS = ["Simulação realística", "Debriefing com vídeo", "ACLS", "ATLS", "Outro"];

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function Field({
  name, label, error, defaultValue, required, type = "text", autoComplete, placeholder, className = "", inputMode, onChangeMask,
}: {
  name: string; label: string; error?: string; defaultValue?: string; required?: boolean; type?: string; autoComplete?: string;
  placeholder?: string; className?: string; inputMode?: "numeric" | "tel" | "email" | "text"; onChangeMask?: (v: string) => string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="label">
        {label} {required && <span className="text-danger" aria-hidden>*</span>}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        className="field"
        value={value}
        onChange={(e) => setValue(onChangeMask ? onChangeMask(e.target.value) : e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `e-${name}` : undefined}
      />
      {error && (
        <p id={`e-${name}`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function RequestForm({
  type,
  submitLabel,
  initialItems = [],
  allowCartImport = false,
  autoImportCart = false,
}: {
  type: QuoteType;
  submitLabel: string;
  initialItems?: RequestItem[];
  allowCartImport?: boolean;
  autoImportCart?: boolean;
}) {
  const [state, action, pending] = useActionState<RequestState, FormData>(submitRequest, { status: "idle" });
  const [items, setItems] = useState<RequestItem[]>(initialItems);
  const { lines } = useCart();
  const errors = state.status === "error" ? state.errors : {};
  const v = state.status === "error" ? state.values : {};

  useEffect(() => {
    if (state.status === "ok") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.status]);

  const [imported, setImported] = useState(false);
  useEffect(() => {
    if (!autoImportCart || imported || lines.length === 0) return;
    setImported(true);
    setItems((cur) => {
      const map = new Map(cur.map((i) => [i.productId, i]));
      for (const l of lines) map.set(l.productId, { productId: l.productId, name: l.name, quantity: l.quantity });
      return [...map.values()];
    });
  }, [autoImportCart, imported, lines]);

  if (state.status === "ok") {
    return (
      <div className="card p-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">Solicitação enviada!</h2>
        {state.number > 0 && <p className="mt-2 text-muted">Número de acompanhamento: <strong className="text-ink">{state.number}</strong></p>}
        <p className="mt-2 text-muted">Enviamos uma confirmação para o seu e-mail. Nossa equipe responde em até 1 dia útil.</p>
        <Link href="/produtos" className="btn btn-primary mt-6">
          Continuar navegando
        </Link>
      </div>
    );
  }

  const isProducts = type === "PRODUCTS";
  return (
    <form
      className="card grid gap-5 p-6 md:p-8"
      onSubmit={(e) => {
        // sem o reset automático do React 19: em caso de erro, o que a pessoa escreveu continua no formulário
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      {errors.form && (
        <p role="alert" className="rounded-[var(--radius-control)] bg-[#fdecec] p-3 text-sm text-danger">
          {errors.form}
        </p>
      )}
      <input type="hidden" name="type" value={type} />
      <div className="hidden" aria-hidden="true">
        <label htmlFor="f-website">Não preencha este campo</label>
        <input id="f-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {isProducts && (
        <fieldset>
          <legend className="label">Produtos</legend>
          <input type="hidden" name="items" value={JSON.stringify(items.map(({ productId, quantity }) => ({ productId, quantity })))} />
          {items.length > 0 ? (
            <ul className="divide-y divide-line rounded-[var(--radius-control)] border border-line">
              {items.map((it) => (
                <li key={it.productId} className="flex items-center gap-3 px-3 py-2">
                  <span className="flex-1 text-[15px] text-ink">{it.name}</span>
                  <label className="sr-only" htmlFor={`q-${it.productId}`}>Quantidade de {it.name}</label>
                  <input
                    id={`q-${it.productId}`}
                    className="field num h-9 min-h-0 w-20 py-0 text-center"
                    inputMode="numeric"
                    value={it.quantity}
                    onChange={(e) => {
                      const q = Math.min(999, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1));
                      setItems((list) => list.map((x) => (x.productId === it.productId ? { ...x, quantity: q } : x)));
                    }}
                  />
                  <button type="button" className="btn btn-ghost px-2" aria-label={`Remover ${it.name}`} onClick={() => setItems((l) => l.filter((x) => x.productId !== it.productId))}>
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Nenhum produto selecionado. Descreva o que precisa na mensagem ou{" "}
              <Link href="/produtos" className="text-brand underline">escolha no catálogo</Link>.
            </p>
          )}
          {allowCartImport && lines.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary mt-3"
              onClick={() =>
                setItems((cur) => {
                  const map = new Map(cur.map((i) => [i.productId, i]));
                  for (const l of lines) map.set(l.productId, { productId: l.productId, name: l.name, quantity: l.quantity });
                  return [...map.values()];
                })
              }
            >
              <ShoppingCart className="size-4" aria-hidden /> Usar os {lines.length} {lines.length === 1 ? "item" : "itens"} do carrinho
            </button>
          )}
        </fieldset>
      )}

      {type === "SOFTWARE" && (
        <fieldset>
          <legend className="label">Soluções de interesse</legend>
          <div className="flex flex-wrap gap-2">
            {SOLUTIONS.map((s) => (
              <label key={s} className="badge cursor-pointer border border-line bg-white px-3 py-2 text-[14px] text-text has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand">
                <input type="checkbox" name="solucoes" value={s} className="sr-only" /> {s}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {type === "MAINTENANCE" && (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="equipment" label="Equipamento" required placeholder="Ex.: simulador de RCP, microscópio binocular" defaultValue={v.equipment} error={errors.equipment} />
          <Field name="brandModel" label="Marca e modelo" placeholder="Se souber" defaultValue={v.brandModel} error={errors.brandModel} />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="name" label="Nome completo" required autoComplete="name" defaultValue={v.name} error={errors.name} />
        <Field name="institution" label={type === "CONTACT" ? "Empresa ou instituição" : "Instituição"} autoComplete="organization" defaultValue={v.institution} error={errors.institution} />
        <Field name="email" label="E-mail" type="email" required autoComplete="email" inputMode="email" defaultValue={v.email} error={errors.email} />
        <Field name="phone" label="Telefone / WhatsApp" required autoComplete="tel" inputMode="tel" defaultValue={v.phone} error={errors.phone} onChangeMask={maskPhone} />
        {isProducts && <Field name="document" label="CNPJ ou CPF" inputMode="numeric" placeholder="Opcional" defaultValue={v.document} error={errors.document} />}
        <div className={`grid grid-cols-[1fr_96px] gap-3 ${isProducts ? "" : "sm:col-span-2"}`}>
          <Field name="city" label="Cidade" autoComplete="address-level2" defaultValue={v.city} error={errors.city} />
          <div>
            <label htmlFor="f-state" className="label">UF</label>
            <select id="f-state" name="state" className="field" defaultValue={v.state ?? ""} autoComplete="address-level1">
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf}>{uf}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="f-message" className="label">
          {type === "MAINTENANCE" ? "Descreva o problema" : "Mensagem"} {(type === "CONTACT" || type === "SOFTWARE") && <span className="text-danger" aria-hidden>*</span>}
        </label>
        <textarea
          id="f-message"
          name="message"
          rows={5}
          className="field"
          defaultValue={v.message}
          placeholder={
            type === "MAINTENANCE"
              ? "O que está acontecendo, desde quando, se o equipamento está na garantia…"
              : type === "PRODUCTS"
                ? "Prazo desejado, forma de pagamento, se é processo de compra institucional…"
                : ""
          }
          aria-invalid={errors.message ? true : undefined}
        />
        {errors.message && <p className="mt-1 text-sm text-danger">{errors.message}</p>}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Usamos seus dados só para responder esta solicitação. Veja a <Link href="/privacidade" className="underline">política de privacidade</Link>.
        </p>
        <button type="submit" className="btn btn-primary h-12 px-6" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} {submitLabel}
        </button>
      </div>
    </form>
  );
}

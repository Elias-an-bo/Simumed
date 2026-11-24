"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Barcode, CreditCard, Loader2, Lock, QrCode } from "lucide-react";
import { SHIPPING_KEY } from "@/components/cart/CartView";
import { maskCep, type ShippingOptionView } from "@/components/product/ShippingCalculator";
import { usePricedCart } from "@/lib/cart/use-priced-cart";
import { formatBRL } from "@/lib/money";
import { pixPrice } from "@/lib/pricing";
import { CardForm, type CardResult } from "./CardForm";

type Method = "PIX" | "CARD" | "BOLETO";
const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function maskDoc(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 11) return d.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

type Form = {
  name: string; email: string; phone: string; document: string; companyName: string; stateRegistration: string;
  cep: string; street: string; number: string; complement: string; district: string; city: string; state: string;
};
const EMPTY: Form = { name: "", email: "", phone: "", document: "", companyName: "", stateRegistration: "", cep: "", street: "", number: "", complement: "", district: "", city: "", state: "" };
const FIELD_KEY: Record<string, keyof Form> = {
  "customer.name": "name", "customer.email": "email", "customer.phone": "phone", "customer.document": "document",
  "address.cep": "cep", "address.street": "street", "address.number": "number", "address.district": "district",
  "address.city": "city", "address.state": "state",
};
const DRAFT_KEY = "simumed:checkout";

export function CheckoutForm({
  pixDiscountPercent, maxInstallments, provider, publicKey,
}: { pixDiscountPercent: number; maxInstallments: number; provider: string; publicKey: string | null }) {
  const router = useRouter();
  const { priced, loading, lines, clear } = usePricedCart();
  const [f, setF] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [options, setOptions] = useState<ShippingOptionView[] | null>(null);
  const [shipping, setShipping] = useState<ShippingOptionView | null>(null);
  const [freightState, setFreightState] = useState<"idle" | "loading" | "on-request" | "error">("idle");
  const [method, setMethod] = useState<Method>("PIX");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const preferredOption = useRef<string | null>(null);
  const quotedFor = useRef("");

  const set = (k: keyof Form, v: string) => setF((cur) => ({ ...cur, [k]: v }));
  const isCompany = f.document.replace(/\D/g, "").length > 11;

  // rascunho e frete escolhido no carrinho
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      if (draft) setF((cur) => ({ ...cur, ...draft }));
      const saved = JSON.parse(sessionStorage.getItem(SHIPPING_KEY) ?? "null");
      if (saved?.cep) {
        preferredOption.current = saved.optionId;
        setF((cur) => (cur.cep ? cur : { ...cur, cep: maskCep(saved.cep) }));
      }
    } catch {}
  }, []);
  useEffect(() => {
    const { document: _d, ...safe } = f; // não guarda CPF/CNPJ no navegador
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(safe));
    } catch {}
  }, [f]);

  const cepDigits = f.cep.replace(/\D/g, "");
  const itemsKey = (priced?.lines ?? []).map((l) => `${l.productId}:${l.quantity}`).join(",");

  // endereço pelo CEP (ViaCEP, no navegador)
  useEffect(() => {
    if (cepDigits.length !== 8) return;
    let cancelled = false;
    fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || d.erro) return;
        setF((cur) => ({
          ...cur,
          street: cur.street || d.logradouro || "",
          district: cur.district || d.bairro || "",
          city: d.localidade || cur.city,
          state: d.uf || cur.state,
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cepDigits]);

  // cotação do frete para o CEP de entrega
  useEffect(() => {
    if (cepDigits.length !== 8 || !itemsKey) return;
    const key = `${cepDigits}|${itemsKey}`;
    if (quotedFor.current === key) return;
    quotedFor.current = key;
    setFreightState("loading");
    setShipping(null);
    setOptions(null);
    fetch("/api/frete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cep: cepDigits, items: priced!.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }),
    })
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error);
        if (data.onRequest) return setFreightState("on-request");
        setOptions(data.options);
        const pre = data.options.find((o: ShippingOptionView) => o.id === preferredOption.current) ?? data.options[0] ?? null;
        setShipping(pre);
        setFreightState("idle");
      })
      .catch(() => setFreightState("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepDigits, itemsKey]);

  const subtotal = priced?.subtotalCents ?? 0;
  const discount = method === "PIX" ? subtotal - pixPrice(subtotal, pixDiscountPercent) : 0;
  const total = subtotal - discount + (shipping?.priceCents ?? 0);
  const blocked = (priced?.blocked.length ?? 0) > 0 || !!priced?.freightOnRequest;

  const payload = useMemo(
    () => ({
      customer: { name: f.name, email: f.email, phone: f.phone, document: f.document, companyName: isCompany ? f.companyName : "", stateRegistration: isCompany ? f.stateRegistration : "" },
      address: { cep: f.cep, street: f.street, number: f.number, complement: f.complement, district: f.district, city: f.city, state: f.state },
      items: (priced?.lines ?? []).map((l) => ({ productId: l.productId, quantity: l.quantity })),
      shippingOptionId: shipping?.id ?? "",
      method,
    }),
    [f, isCompany, priced, shipping, method],
  );

  function validateLocally(): boolean {
    const e: Partial<Record<keyof Form, string>> = {};
    if (f.name.trim().split(/\s+/).length < 2) e.name = "Informe nome e sobrenome.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = "Informe um e-mail válido.";
    if (f.phone.replace(/\D/g, "").length < 10) e.phone = "Informe um telefone com DDD.";
    const dl = f.document.replace(/\D/g, "").length;
    if (dl !== 11 && dl !== 14) e.document = "Informe CPF ou CNPJ.";
    if (cepDigits.length !== 8) e.cep = "CEP inválido.";
    for (const k of ["street", "number", "district", "city", "state"] as const) if (!f[k].trim()) e[k] = "Obrigatório.";
    setErrors(e);
    if (Object.keys(e).length) {
      setFormError("Confira os campos destacados.");
      document.getElementById(`c-${Object.keys(e)[0]}`)?.focus();
      return false;
    }
    if (!shipping) {
      setFormError("Escolha uma opção de frete.");
      return false;
    }
    return true;
  }

  async function submit(card?: CardResult) {
    setFormError(null);
    if (!validateLocally()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, card }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) {
          const e: Partial<Record<keyof Form, string>> = {};
          for (const [k, v] of Object.entries(data.fields as Record<string, string>)) if (FIELD_KEY[k]) e[FIELD_KEY[k]] = v;
          setErrors(e);
        }
        if (data.code === "shipping-changed") quotedFor.current = "";
        setFormError(data.error ?? "Não foi possível concluir o pedido.");
        return;
      }
      clear();
      try {
        sessionStorage.removeItem(SHIPPING_KEY);
      } catch {}
      router.push(`/pedido/${data.orderId}?t=${data.accessToken}`);
    } catch {
      setFormError("Falha de conexão. Verifique a internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && lines.length === 0) {
    return (
      <div className="card mt-8 p-10 text-center">
        <p className="text-lg font-semibold text-ink">Seu carrinho está vazio.</p>
        <Link href="/produtos" className="btn btn-primary mt-6">
          Ver produtos
        </Link>
      </div>
    );
  }

  const input = (k: keyof Form, label: string, { className: wrapClass, ...props }: React.InputHTMLAttributes<HTMLInputElement> = {}, mask?: (v: string) => string) => (
    <div className={wrapClass}>
      <label htmlFor={`c-${k}`} className="label">
        {label}
      </label>
      <input
        id={`c-${k}`}
        {...props}
        className="field"
        value={f[k]}
        onChange={(e) => set(k, mask ? mask(e.target.value) : e.target.value)}
        aria-invalid={errors[k] ? true : undefined}
        aria-describedby={errors[k] ? `ce-${k}` : undefined}
      />
      {errors[k] && (
        <p id={`ce-${k}`} className="mt-1 text-sm text-danger">
          {errors[k]}
        </p>
      )}
    </div>
  );

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {blocked && (
          <p className="rounded-[var(--radius-card)] bg-warn-soft p-4 text-sm text-warn">
            Alguns itens do carrinho mudaram ou têm frete sob consulta. <Link href="/carrinho" className="font-semibold underline">Revise o carrinho</Link>.
          </p>
        )}

        <section className="card p-6" aria-labelledby="h-dados">
          <h2 id="h-dados" className="text-xl font-bold">1. Seus dados</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {input("name", "Nome completo", { autoComplete: "name", className: "sm:col-span-2" })}
            {input("email", "E-mail", { type: "email", autoComplete: "email", inputMode: "email" })}
            {input("phone", "Telefone / WhatsApp", { autoComplete: "tel", inputMode: "tel" }, maskPhone)}
            {input("document", "CPF ou CNPJ", { inputMode: "numeric" }, maskDoc)}
            {isCompany && input("companyName", "Razão social", { autoComplete: "organization" })}
            {isCompany && input("stateRegistration", "Inscrição estadual (opcional)", {})}
          </div>
        </section>

        <section className="card p-6" aria-labelledby="h-entrega">
          <h2 id="h-entrega" className="text-xl font-bold">2. Entrega</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-6">
            {input("cep", "CEP", { inputMode: "numeric", autoComplete: "postal-code", className: "sm:col-span-2" }, maskCep)}
            {input("street", "Rua / avenida", { autoComplete: "address-line1", className: "sm:col-span-4" })}
            {input("number", "Número", { className: "sm:col-span-2" })}
            {input("complement", "Complemento", { autoComplete: "address-line2", className: "sm:col-span-4" })}
            {input("district", "Bairro", { className: "sm:col-span-2" })}
            {input("city", "Cidade", { autoComplete: "address-level2", className: "sm:col-span-3" })}
            <div>
              <label htmlFor="c-state" className="label">UF</label>
              <select id="c-state" className="field" value={f.state} onChange={(e) => set("state", e.target.value)} aria-invalid={errors.state ? true : undefined}>
                <option value="">—</option>
                {UFS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-5" aria-live="polite">
            {freightState === "loading" && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Calculando frete…
              </p>
            )}
            {freightState === "on-request" && <p className="rounded-[var(--radius-control)] bg-warn-soft p-3 text-sm text-warn">Não há entrega automática para este CEP. <Link href="/orcamento?carrinho=1" className="font-semibold underline">Envie como orçamento</Link>.</p>}
            {freightState === "error" && <p className="text-sm text-danger">Não foi possível calcular o frete. Confira o CEP ou tente de novo.</p>}
            {options && (
              <fieldset>
                <legend className="label">Frete</legend>
                <ul className="divide-y divide-line rounded-[var(--radius-control)] border border-line">
                  {options.map((o) => (
                    <li key={o.id}>
                      <label className={`flex cursor-pointer items-center gap-3 px-4 py-3 ${shipping?.id === o.id ? "bg-brand-soft" : ""}`}>
                        <input type="radio" name="frete" checked={shipping?.id === o.id} onChange={() => setShipping(o)} />
                        <span className="flex-1">
                          <span className="block font-semibold text-ink">{o.name}</span>
                          <span className="block text-sm text-muted">{o.company} · até {o.days} dias úteis</span>
                        </span>
                        <span className="num whitespace-nowrap font-semibold">{formatBRL(o.priceCents)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            )}
          </div>
        </section>

        <section className="card p-6" aria-labelledby="h-pag">
          <h2 id="h-pag" className="text-xl font-bold">3. Pagamento</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Forma de pagamento">
            {([
              ["PIX", "Pix", QrCode, pixDiscountPercent > 0 ? `${pixDiscountPercent}% de desconto` : "Aprovação imediata"],
              ["CARD", "Cartão de crédito", CreditCard, `Em até ${maxInstallments}×`],
              ["BOLETO", "Boleto", Barcode, "Compensa em até 3 dias úteis"],
            ] as const).map(([value, label, Icon, hint]) => (
              <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border p-4 ${method === value ? "border-brand bg-brand-soft" : "border-line"}`}>
                <input type="radio" name="metodo" className="mt-1" checked={method === value} onChange={() => setMethod(value)} />
                <span>
                  <span className="flex items-center gap-2 font-semibold text-ink">
                    <Icon className="size-4 text-brand" aria-hidden /> {label}
                  </span>
                  <span className="block text-sm text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
          {method === "CARD" && (
            <div className="mt-5">
              {shipping ? (
                <CardForm
                  provider={provider}
                  publicKey={publicKey}
                  amountCents={total}
                  maxInstallments={maxInstallments}
                  email={f.email}
                  disabled={submitting || blocked}
                  onSubmit={(card) => submit(card)}
                />
              ) : (
                <p className="text-sm text-muted">Informe o endereço e escolha o frete para pagar com cartão.</p>
              )}
            </div>
          )}
          {method === "BOLETO" && <p className="mt-4 text-sm text-muted">O boleto é gerado após finalizar o pedido e vale por 3 dias. O envio acontece depois da compensação.</p>}
          {method === "PIX" && <p className="mt-4 text-sm text-muted">O QR Code aparece na próxima tela e vale por 1 hora. A confirmação é automática.</p>}
        </section>
      </div>

      <aside className="lg:sticky lg:top-40 lg:self-start">
        <div className="card p-5">
          <h2 className="text-lg font-bold">Resumo do pedido</h2>
          <ul className="mt-4 space-y-3">
            {(priced?.lines ?? []).map((l) => (
              <li key={l.productId} className="flex gap-3 text-sm">
                <span className="num font-semibold text-muted">{l.quantity}×</span>
                <span className="flex-1 text-ink">{l.name}</span>
                <span className="num whitespace-nowrap">{formatBRL(l.totalCents)}</span>
              </li>
            ))}
          </ul>
          <dl className="num mt-4 space-y-2 border-t border-line pt-4 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatBRL(subtotal)}</dd>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-brand">
                <dt>Desconto Pix</dt>
                <dd>− {formatBRL(discount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Frete</dt>
              <dd>{shipping ? formatBRL(shipping.priceCents) : "—"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-bold text-ink">
              <dt>Total</dt>
              <dd>{formatBRL(total)}</dd>
            </div>
          </dl>
          {formError && (
            <p role="alert" className="mt-4 rounded-[var(--radius-control)] bg-[#fdecec] p-3 text-sm text-danger">
              {formError}
            </p>
          )}
          {method !== "CARD" && (
            <button type="button" className="btn btn-primary mt-5 h-12 w-full text-base" disabled={submitting || blocked || !priced} onClick={() => submit()}>
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Lock className="size-4" aria-hidden />}
              {method === "PIX" ? "Finalizar e gerar Pix" : "Finalizar e gerar boleto"}
            </button>
          )}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <Lock className="size-3.5" aria-hidden /> Pagamento processado em ambiente seguro
          </p>
          <p className="mt-2 text-center text-xs text-muted">
            Ao finalizar, você concorda com os <Link href="/termos" className="underline">termos</Link> e a <Link href="/trocas-e-devolucoes" className="underline">política de trocas</Link>.
          </p>
        </div>
      </aside>
    </div>
  );
}

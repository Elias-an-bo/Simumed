"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, FileText, Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { ShippingCalculator, type ShippingOptionView } from "@/components/product/ShippingCalculator";
import { usePricedCart } from "@/lib/cart/use-priced-cart";
import { formatBRL } from "@/lib/money";
import { pixPrice } from "@/lib/pricing";

export const SHIPPING_KEY = "simumed:frete";

export function CartView({ pixDiscountPercent, maxInstallments }: { pixDiscountPercent: number; maxInstallments: number }) {
  const { lines, priced, loading, update, remove } = usePricedCart();
  const [shipping, setShipping] = useState<ShippingOptionView | null>(null);
  const [cep, setCep] = useState("");

  useEffect(() => {
    setShipping(null); // carrinho mudou: frete precisa ser recalculado
  }, [priced?.subtotalCents, priced?.lines.length]);

  useEffect(() => {
    try {
      if (shipping) sessionStorage.setItem(SHIPPING_KEY, JSON.stringify({ cep, optionId: shipping.id }));
      else sessionStorage.removeItem(SHIPPING_KEY);
    } catch {}
  }, [shipping, cep]);

  if (lines.length === 0) {
    return (
      <div className="card mt-8 p-10 text-center">
        <ShoppingBag className="mx-auto size-12 text-muted" aria-hidden />
        <p className="mt-4 text-lg font-semibold text-ink">Seu carrinho está vazio.</p>
        <Link href="/produtos" className="btn btn-primary mt-6">
          Ver produtos
        </Link>
      </div>
    );
  }

  const view = priced;
  const subtotal = view?.subtotalCents ?? 0;
  const total = subtotal + (shipping?.priceCents ?? 0);
  const canCheckout = !!view && view.lines.length > 0 && !view.freightOnRequest && view.blocked.length === 0;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {view?.blocked.map((b) => (
          <div key={b.productId} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-warn/30 bg-warn-soft p-4 text-sm text-warn">
            <AlertTriangle className="size-5 shrink-0" aria-hidden />
            <p className="flex-1">
              <strong>{b.name ?? "Um produto"}</strong>{" "}
              {b.reason === "quote" ? "agora é vendido sob orçamento." : "não está mais disponível."}
            </p>
            {b.reason === "quote" && b.slug && (
              <Link href={`/orcamento?produto=${b.slug}`} className="font-semibold underline">
                Pedir orçamento
              </Link>
            )}
            <button type="button" className="font-semibold underline" onClick={() => remove(b.productId)}>
              Remover
            </button>
          </div>
        ))}
        <ul className="card divide-y divide-line">
          {(view?.lines ?? []).map((l) => (
            <li key={l.productId} className="grid grid-cols-[72px_1fr] gap-4 p-4 sm:grid-cols-[96px_1fr_auto]">
              <Link href={`/produtos/${l.slug}`} className="aspect-square overflow-hidden rounded-xl border border-line bg-white">
                {l.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.image} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <span className="flex h-full items-center justify-center bg-brand-soft text-xs text-brand">sem foto</span>
                )}
              </Link>
              <div className="min-w-0">
                <Link href={`/produtos/${l.slug}`} className="line-clamp-2 font-semibold text-ink hover:text-brand">
                  {l.name}
                </Link>
                <p className="mt-0.5 text-sm text-muted">Código {l.sku} · {formatBRL(l.unitPriceCents)} cada</p>
                {l.freightOnRequest && <p className="mt-1 text-sm text-warn">Frete sob consulta</p>}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-9 items-center rounded-[var(--radius-control)] border border-line" role="group" aria-label={`Quantidade de ${l.name}`}>
                    <button type="button" className="flex h-full w-9 items-center justify-center disabled:opacity-40" disabled={l.quantity <= 1} onClick={() => update(l.productId, l.quantity - 1)} aria-label="Diminuir">
                      <Minus className="size-3.5" aria-hidden />
                    </button>
                    <span className="num w-9 text-center text-sm font-semibold">{l.quantity}</span>
                    <button type="button" className="flex h-full w-9 items-center justify-center" onClick={() => update(l.productId, l.quantity + 1)} aria-label="Aumentar">
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                  </div>
                  <button type="button" className="inline-flex items-center gap-1 text-sm text-muted hover:text-danger" onClick={() => remove(l.productId)}>
                    <Trash2 className="size-4" aria-hidden /> Remover
                  </button>
                </div>
              </div>
              <p className="num col-span-2 text-right font-bold text-ink sm:col-span-1">{formatBRL(l.totalCents)}</p>
            </li>
          ))}
          {loading && !view && (
            <li className="flex items-center gap-2 p-6 text-muted">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Atualizando preços…
            </li>
          )}
        </ul>
        <Link href="/produtos" className="btn btn-ghost">
          Continuar comprando
        </Link>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-40 lg:self-start">
        <div className="card p-5">
          <h2 className="text-lg font-bold">Resumo</h2>
          <dl className="num mt-4 space-y-2 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatBRL(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Frete</dt>
              <dd>{shipping ? formatBRL(shipping.priceCents) : view?.freightOnRequest ? "sob consulta" : "calcule abaixo"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-bold text-ink">
              <dt>Total</dt>
              <dd>{formatBRL(total)}</dd>
            </div>
            {pixDiscountPercent > 0 && (
              <p className="text-right text-sm text-brand">
                {formatBRL(pixPrice(subtotal, pixDiscountPercent) + (shipping?.priceCents ?? 0))} no Pix
              </p>
            )}
            {maxInstallments > 1 && <p className="text-right text-sm text-muted">ou em até {maxInstallments}× no cartão</p>}
          </dl>
          {!view?.freightOnRequest && view && view.lines.length > 0 && (
            <div className="mt-5">
              <ShippingCalculator
                compact
                items={view.lines.map((l) => ({ productId: l.productId, quantity: l.quantity }))}
                selectedId={shipping?.id ?? null}
                onSelect={(o, c) => {
                  setShipping(o);
                  setCep(c);
                }}
              />
            </div>
          )}
          {view?.freightOnRequest && (
            <p className="mt-4 rounded-[var(--radius-control)] bg-warn-soft p-3 text-sm text-warn">
              Há itens grandes no carrinho. Envie como orçamento que calculamos a melhor entrega para você.
            </p>
          )}
          <div className="mt-5 grid gap-2">
            {canCheckout ? (
              <Link
                href="/checkout"
                aria-disabled={!shipping}
                className={`btn btn-primary h-12 text-base ${shipping ? "" : "pointer-events-none opacity-55"}`}
              >
                Finalizar compra
              </Link>
            ) : null}
            {canCheckout && !shipping && <p className="text-center text-xs text-muted">Escolha uma opção de frete para continuar.</p>}
            <Link href="/orcamento?carrinho=1" className="btn btn-secondary">
              <FileText className="size-4" aria-hidden /> Transformar em orçamento
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

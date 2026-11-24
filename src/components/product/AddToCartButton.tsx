"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/store";
import type { CartLine } from "@/lib/cart/lines";

export function AddToCartButton({ item }: { item: Omit<CartLine, "quantity"> }) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex h-12 items-center rounded-[var(--radius-control)] border border-line" role="group" aria-label="Quantidade">
        <button type="button" className="flex h-full w-11 items-center justify-center text-ink disabled:opacity-40" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Diminuir quantidade">
          <Minus className="size-4" aria-hidden />
        </button>
        <input
          className="num h-full w-12 border-x border-line text-center font-semibold text-ink outline-none"
          inputMode="numeric"
          aria-label="Quantidade"
          value={qty}
          onChange={(e) => setQty(Math.min(99, Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1)))}
        />
        <button type="button" className="flex h-full w-11 items-center justify-center text-ink" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Aumentar quantidade">
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      <button
        type="button"
        className="btn btn-primary h-12 flex-1 text-base"
        onClick={() => {
          add(item, qty);
          setAdded(true);
        }}
      >
        {added ? <Check className="size-5" aria-hidden /> : <ShoppingCart className="size-5" aria-hidden />}
        {added ? "Adicionado ao carrinho" : "Adicionar ao carrinho"}
      </button>
      {added && (
        <button type="button" className="btn btn-secondary h-12" onClick={() => router.push("/carrinho")}>
          Ver carrinho
        </button>
      )}
    </div>
  );
}

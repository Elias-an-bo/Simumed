"use client";

import { useEffect, useState } from "react";
import { useCart } from "./store";

export interface PricedCartView {
  lines: { productId: string; sku: string; slug: string; name: string; image: string | null; unitPriceCents: number; quantity: number; totalCents: number; freightOnRequest: boolean }[];
  blocked: { productId: string; name: string | null; slug: string | null; reason: "unavailable" | "quote" }[];
  subtotalCents: number;
  freightOnRequest: boolean;
}

/** Carrinho do navegador reprecificado pelo servidor; atualiza o preço guardado localmente. */
export function usePricedCart() {
  const cart = useCart();
  const [priced, setPriced] = useState<PricedCartView | null>(null);
  const [loading, setLoading] = useState(true);
  const key = cart.lines.map((l) => `${l.productId}:${l.quantity}`).join(",");

  useEffect(() => {
    let cancelled = false;
    if (!key) {
      setPriced({ lines: [], blocked: [], subtotalCents: 0, freightOnRequest: false });
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/carrinho", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })) }),
    })
      .then((r) => r.json())
      .then((data: PricedCartView) => {
        if (!cancelled) setPriced(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { ...cart, priced, loading };
}

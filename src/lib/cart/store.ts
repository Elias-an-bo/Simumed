"use client";

import { useCallback, useSyncExternalStore } from "react";
import { addLine, cartCount, removeLine, setLineQuantity, type CartLine } from "./lines";

const KEY = "simumed:cart:v1";
const EVENT = "simumed:cart";
const EMPTY: CartLine[] = [];
let cache: { raw: string | null; lines: CartLine[] } = { raw: null, lines: EMPTY };

function read(): CartLine[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return cache.lines;
  }
  if (raw === cache.raw) return cache.lines;
  let lines: CartLine[] = EMPTY;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    lines = Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.productId === "string") : EMPTY;
  } catch {
    lines = EMPTY;
  }
  cache = { raw, lines };
  return lines;
}

function write(lines: CartLine[]) {
  const raw = JSON.stringify(lines);
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    // modo privado/armazenamento bloqueado: mantém só em memória
  }
  cache = { raw, lines };
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useCartLines(): CartLine[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function useCartCount(): number {
  return cartCount(useCartLines());
}

export function useCart() {
  const lines = useCartLines();
  const add = useCallback((item: Omit<CartLine, "quantity">, qty = 1) => write(addLine(read(), item, qty)), []);
  const update = useCallback((productId: string, qty: number) => write(setLineQuantity(read(), productId, qty)), []);
  const remove = useCallback((productId: string) => write(removeLine(read(), productId)), []);
  const clear = useCallback(() => write([]), []);
  return { lines, add, update, remove, clear };
}

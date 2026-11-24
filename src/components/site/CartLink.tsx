"use client";

import Link from "next/link";
import { useCartCount } from "@/lib/cart/store";

export function CartLink({ children }: { children: React.ReactNode }) {
  const count = useCartCount();
  return (
    <Link href="/carrinho" className="btn btn-ghost relative px-3" aria-label={`Carrinho, ${count} ${count === 1 ? "item" : "itens"}`}>
      {children}
      <span className="hidden lg:inline">Carrinho</span>
      {count > 0 && (
        <span className="num absolute right-0.5 top-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold leading-5 text-white lg:static lg:ml-0.5">
          {count}
        </span>
      )}
    </Link>
  );
}

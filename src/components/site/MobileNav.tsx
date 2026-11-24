"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import type { CategoryNode } from "@/lib/catalog/queries";

export function MobileNav({ categories, extra }: { categories: CategoryNode[]; extra: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button type="button" className="btn btn-ghost -ml-2 px-2" aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <Menu className="size-6" aria-hidden />
      </button>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Fechar menu" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-[family-name:var(--font-display)] text-lg font-bold text-ink">Menu</span>
              <button type="button" className="btn btn-ghost px-2" aria-label="Fechar menu" onClick={() => setOpen(false)}>
                <X className="size-6" aria-hidden />
              </button>
            </div>
            <form action="/produtos" className="relative p-4" role="search">
              <input name="q" type="search" placeholder="Buscar produtos" aria-label="Buscar produtos" className="field rounded-full pl-10" />
              <Search className="pointer-events-none absolute left-7 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            </form>
            <ul className="px-2 pb-4">
              {categories.map((c) => (
                <li key={c.slug} className="border-b border-line/70 py-1">
                  <Link href={`/categoria/${c.slug}`} className="block rounded-lg px-3 py-2.5 font-semibold text-ink">
                    {c.name}
                  </Link>
                  {c.children.length > 0 && (
                    <ul className="mb-2 ml-3 border-l border-line pl-2">
                      {c.children.map((ch) => (
                        <li key={ch.slug}>
                          <Link href={`/categoria/${ch.slug}`} className="block rounded-lg px-3 py-1.5 text-[15px] text-text">
                            {ch.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
              {[...extra, { href: "/orcamento", label: "Orçamento para instituições" }, { href: "/contato", label: "Contato" }].map((e) => (
                <li key={e.href} className="border-b border-line/70 py-1">
                  <Link href={e.href} className="block rounded-lg px-3 py-2.5 font-semibold text-ink">
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

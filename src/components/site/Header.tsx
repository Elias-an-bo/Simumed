import Link from "next/link";
import { ChevronDown, FileText, Mail, MessageCircle, Search, ShoppingCart } from "lucide-react";
import { getCategoryTree } from "@/lib/catalog/queries";
import { getSettings, whatsappLink } from "@/lib/settings";
import { Logo } from "@/components/Logo";
import { MobileNav } from "./MobileNav";
import { CartLink } from "./CartLink";

export async function Header() {
  const [tree, settings] = await Promise.all([getCategoryTree(), getSettings()]);
  const wa = whatsappLink(settings.whatsapp, "Olá! Vim pelo site da Simumed.");
  const extra = [
    { href: "/softwares", label: "Softwares" },
    { href: "/manutencao", label: "Manutenção" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="hidden bg-ink text-[13px] text-white/80 md:block">
        <div className="container-site flex h-9 items-center justify-between">
          <p>Atendimento a instituições de ensino e saúde em todo o Brasil</p>
          <div className="flex items-center gap-5">
            {wa && (
              <a href={wa} className="inline-flex items-center gap-1.5 hover:text-white" target="_blank" rel="noopener">
                <MessageCircle className="size-3.5" aria-hidden /> WhatsApp
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`} className="inline-flex items-center gap-1.5 hover:text-white">
                <Mail className="size-3.5" aria-hidden /> {settings.email}
              </a>
            )}
            <Link href="/orcamento" className="hover:text-white">
              Orçamento para instituições
            </Link>
          </div>
        </div>
      </div>

      <div className="container-site flex h-16 items-center gap-3 md:h-[72px] md:gap-6">
        <MobileNav categories={tree} extra={extra} />
        <Link href="/" className="shrink-0" aria-label="Simumed — página inicial">
          <Logo />
        </Link>
        <form action="/produtos" className="relative hidden flex-1 md:block" role="search">
          <label htmlFor="busca" className="sr-only">
            Buscar produtos
          </label>
          <input
            id="busca"
            name="q"
            type="search"
            placeholder="Buscar simuladores, modelos, microscópios…"
            className="field h-11 rounded-full pl-11"
          />
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        </form>
        <nav className="ml-auto flex items-center gap-1 md:ml-0" aria-label="Atalhos">
          <Link href="/produtos" className="btn btn-ghost px-3 md:hidden" aria-label="Buscar">
            <Search className="size-5" aria-hidden />
          </Link>
          <Link href="/orcamento" className="btn btn-ghost hidden px-3 lg:inline-flex">
            <FileText className="size-5" aria-hidden /> Orçamento
          </Link>
          <CartLink>
            <ShoppingCart className="size-5" aria-hidden />
          </CartLink>
        </nav>
      </div>

      <nav className="hidden border-t border-line md:block" aria-label="Categorias">
        <ul className="container-site flex h-12 items-center gap-0.5 whitespace-nowrap text-[14px] font-medium xl:text-[15px]">
          {tree.map((c) => (
            <li key={c.slug} className="group relative">
              <Link
                href={`/categoria/${c.slug}`}
                className="inline-flex h-12 items-center gap-1 rounded-md px-2 text-ink hover:text-brand xl:px-3"
              >
                {c.name}
                {c.children.length > 0 && <ChevronDown className="size-3.5 opacity-60" aria-hidden />}
              </Link>
              {c.children.length > 0 && (
                <div className="invisible absolute left-0 top-full z-50 min-w-64 translate-y-1 rounded-[var(--radius-card)] border border-line bg-white p-2 opacity-0 shadow-[var(--shadow-lift)] transition duration-150 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {c.children.map((ch) => (
                    <Link
                      key={ch.slug}
                      href={`/categoria/${ch.slug}`}
                      className="flex items-center justify-between gap-4 rounded-lg px-3 py-2 text-[14px] text-text hover:bg-surface hover:text-brand"
                    >
                      {ch.name}
                      <span className="text-xs text-muted">{ch.count}</span>
                    </Link>
                  ))}
                  <Link href={`/categoria/${c.slug}`} className="mt-1 block rounded-lg px-3 py-2 text-[14px] font-semibold text-brand hover:bg-surface">
                    Ver tudo em {c.name}
                  </Link>
                </div>
              )}
            </li>
          ))}
          <li className="ml-auto flex items-center gap-1">
            {extra.map((e) => (
              <Link key={e.href} href={e.href} className="inline-flex h-12 items-center rounded-md px-2 text-ink hover:text-brand xl:px-3">
                {e.label}
              </Link>
            ))}
          </li>
        </ul>
      </nav>
    </header>
  );
}

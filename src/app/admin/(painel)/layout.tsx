import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, FileText, Gauge, LogOut, Package, Settings, ShoppingBag, Tags } from "lucide-react";
import { Logo } from "@/components/Logo";
import { requireAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logoutAction } from "../actions";

export const metadata: Metadata = { title: "Painel", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [newQuotes, toShip] = await Promise.all([
    prisma.quoteRequest.count({ where: { status: "NEW" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PREPARING"] } } }),
  ]);
  const nav = [
    { href: "/admin", label: "Resumo", icon: Gauge },
    { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, count: toShip },
    { href: "/admin/orcamentos", label: "Orçamentos", icon: FileText, count: newQuotes },
    { href: "/admin/produtos", label: "Produtos", icon: Package },
    { href: "/admin/categorias", label: "Categorias e margens", icon: Tags },
    { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  ];
  return (
    <div className="min-h-screen bg-surface lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between p-4 lg:block lg:p-5">
          <Link href="/admin" aria-label="Resumo do painel">
            <Logo />
          </Link>
          <p className="hidden text-xs text-muted lg:mt-2 lg:block">Painel da loja · {admin.email}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3" aria-label="Painel">
          {nav.map(({ href, label, icon: Icon, count }) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium text-ink hover:bg-surface">
              <Icon className="size-4 text-brand" aria-hidden /> {label}
              {!!count && <span className="num ml-auto rounded-full bg-brand px-2 text-xs font-bold text-white">{count}</span>}
            </Link>
          ))}
          <Link href="/" target="_blank" className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-muted hover:bg-surface lg:mt-4">
            <ExternalLink className="size-4" aria-hidden /> Ver loja
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="flex w-full shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-[15px] text-muted hover:bg-surface">
              <LogOut className="size-4" aria-hidden /> Sair
            </button>
          </form>
        </nav>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}

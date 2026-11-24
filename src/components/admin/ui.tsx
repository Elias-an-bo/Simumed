import Link from "next/link";
import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/orders/status";

const ORDER_STYLE: Record<OrderStatusValue, string> = {
  PENDING_PAYMENT: "bg-warn-soft text-warn",
  PAID: "bg-success-soft text-success",
  PREPARING: "bg-brand-soft text-brand",
  SHIPPED: "bg-[#e8f0fb] text-accent",
  DELIVERED: "bg-surface text-muted",
  CANCELED: "bg-[#fdecec] text-danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatusValue }) {
  return <span className={`badge ${ORDER_STYLE[status]}`}>{ORDER_STATUS_LABEL[status]}</span>;
}

export const QUOTE_STATUS_LABEL = { NEW: "Novo", IN_PROGRESS: "Em andamento", ANSWERED: "Respondido", WON: "Fechado", LOST: "Perdido" } as const;
export const QUOTE_TYPE_SHORT = { PRODUCTS: "Produtos", SOFTWARE: "Softwares", MAINTENANCE: "Manutenção", CONTACT: "Contato" } as const;

export function QuoteStatusBadge({ status }: { status: keyof typeof QUOTE_STATUS_LABEL }) {
  const style = status === "NEW" ? "bg-warn-soft text-warn" : status === "WON" ? "bg-success-soft text-success" : status === "LOST" ? "bg-[#fdecec] text-danger" : "bg-brand-soft text-brand";
  return <span className={`badge ${style}`}>{QUOTE_STATUS_LABEL[status]}</span>;
}

export function AdminTitle({ title, children, back }: { title: string; children?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="text-sm text-muted hover:text-brand">
          ← {back.label}
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold sm:text-[28px]">{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function Notice({ kind = "ok", children }: { kind?: "ok" | "error"; children: React.ReactNode }) {
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`mb-5 rounded-[var(--radius-control)] p-3 text-sm ${kind === "ok" ? "bg-success-soft text-success" : "bg-[#fdecec] text-danger"}`}>
      {children}
    </p>
  );
}

export function Tabs({ items, active }: { items: { href: string; label: string; key: string; count?: number }[]; active: string }) {
  return (
    <nav className="mb-5 flex flex-wrap gap-2" aria-label="Filtros">
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === active ? "page" : undefined}
          className={`badge border px-3 py-1.5 text-[13px] ${t.key === active ? "border-brand bg-brand-soft text-brand" : "border-line bg-white text-text hover:border-brand"}`}
        >
          {t.label}
          {t.count !== undefined && <span className="num text-muted">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function fmtDate(d: Date) {
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

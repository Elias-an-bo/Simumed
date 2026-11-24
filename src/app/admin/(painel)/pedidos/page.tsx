import Link from "next/link";
import { AdminTitle, OrderStatusBadge, Tabs, fmtDate } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL, type OrderStatusValue } from "@/lib/orders/status";

const METHOD = { PIX: "Pix", CARD: "Cartão", BOLETO: "Boleto" } as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const valid = status && status in ORDER_STATUS_LABEL ? (status as OrderStatusValue) : undefined;
  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      where: {
        ...(valid ? { status: valid } : {}),
        ...(q ? { OR: [{ customerName: { contains: q, mode: "insensitive" } }, { customerEmail: { contains: q, mode: "insensitive" } }, ...(Number(q) ? [{ number: Number(q) }] : [])] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  return (
    <>
      <AdminTitle title="Pedidos">
        <form className="w-full sm:w-72">
          <input name="q" defaultValue={q} placeholder="Buscar nº, nome ou e-mail" className="field h-10 min-h-0" aria-label="Buscar pedidos" />
        </form>
      </AdminTitle>
      <Tabs
        active={valid ?? "all"}
        items={[
          { key: "all", href: "/admin/pedidos", label: "Todos" },
          ...(Object.keys(ORDER_STATUS_LABEL) as OrderStatusValue[]).map((s) => ({ key: s, href: `/admin/pedidos?status=${s}`, label: ORDER_STATUS_LABEL[s], count: count(s) })),
        ]}
      />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Nº</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Pagamento</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted">Nenhum pedido.</td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-surface">
                <td className="num px-4 py-3 font-semibold">
                  <Link href={`/admin/pedidos/${o.id}`} className="text-brand">#{o.number}</Link>
                </td>
                <td className="px-4 py-3 text-muted">{fmtDate(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="hover:text-brand">
                    {o.companyName ?? o.customerName}
                  </Link>
                  <span className="block text-xs text-muted">{o.city}/{o.state}</span>
                </td>
                <td className="px-4 py-3">{METHOD[o.paymentMethod]}{o.installments > 1 ? ` ${o.installments}×` : ""}</td>
                <td className="num px-4 py-3 text-right font-semibold">{formatBRL(o.totalCents)}</td>
                <td className="px-4 py-3"><OrderStatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

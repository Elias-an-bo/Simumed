import { AdminTitle, Notice } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { importCostsAction } from "../../../actions";

export default async function ImportCosts({ searchParams }: { searchParams: Promise<{ ok?: string; precos?: string; desconhecidos?: string; erro?: string }> }) {
  const sp = await searchParams;
  const [withCost, total] = await Promise.all([prisma.product.count({ where: { costCents: { gt: 0 } } }), prisma.product.count()]);
  return (
    <>
      <AdminTitle title="Importar custos do fornecedor" back={{ href: "/admin/produtos", label: "Produtos" }} />
      {sp.ok && <Notice>{sp.ok} produtos atualizados · {sp.precos} preços recalculados{Number(sp.desconhecidos) ? ` · ${sp.desconhecidos} códigos não encontrados` : ""}.</Notice>}
      {sp.erro && <Notice kind="error">Arquivo inválido. Use o arquivo custos.json gerado a partir da cotação.</Notice>}
      <div className="card max-w-2xl p-6">
        <p className="text-[15px]">
          <strong className="num">{withCost}</strong> de <strong className="num">{total}</strong> produtos têm custo cadastrado. Produtos sem custo aparecem na loja como “sob orçamento”.
        </p>
        <p className="mt-3 text-sm text-muted">
          Os custos ficam só no banco de dados da loja — nunca no código do site. Envie o arquivo <code>custos.json</code> gerado a partir da cotação do fornecedor. Os preços de venda são recalculados com as margens configuradas.
        </p>
        <form action={importCostsAction} className="mt-5 flex flex-wrap items-center gap-3">
          <input type="file" name="file" accept="application/json,.json" required className="text-sm" />
          <button type="submit" className="btn btn-primary">Importar e recalcular preços</button>
        </form>
      </div>
    </>
  );
}

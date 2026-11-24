import type { Metadata } from "next";
import { Building2, FileCheck2, Timer } from "lucide-react";
import { RequestForm, type RequestItem } from "@/components/forms/RequestForm";
import { ContactAside } from "@/components/site/ContactAside";
import { PageIntro } from "@/components/site/PageIntro";
import { getProductBySlug } from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "Solicitar orçamento",
  description: "Peça uma proposta para sua instituição: simuladores, modelos anatômicos, microscópios e softwares de simulação.",
  alternates: { canonical: "/orcamento" },
};

export default async function QuotePage({ searchParams }: { searchParams: Promise<{ produto?: string; carrinho?: string }> }) {
  const { produto, carrinho } = await searchParams;
  const initial: RequestItem[] = [];
  if (produto) {
    const p = await getProductBySlug(produto);
    if (p) initial.push({ productId: p.id, name: p.name, quantity: 1 });
  }
  return (
    <>
      <PageIntro
        crumb="Orçamento"
        eyebrow="Compras institucionais"
        title="Solicite um orçamento"
        description="Monte sua lista e receba uma proposta com valores, prazos de entrega e condições de pagamento para a sua instituição."
      />
      <div className="container-site grid gap-8 py-10 lg:grid-cols-[1fr_340px] lg:py-14">
        <RequestForm type="PRODUCTS" submitLabel="Enviar solicitação" initialItems={initial} allowCartImport autoImportCart={carrinho === "1"} />
        <aside className="space-y-5">
          <ul className="card space-y-5 p-6">
            {[
              { icon: Timer, t: "Resposta em até 1 dia útil", d: "Com valores, prazo e frete até a sua cidade." },
              { icon: Building2, t: "Proposta para CNPJ", d: "Com os dados da instituição, pronta para o setor de compras." },
              { icon: FileCheck2, t: "Ficha técnica", d: "Enviamos especificações para apoiar a sua aprovação interna." },
            ].map(({ icon: Icon, t, d }) => (
              <li key={t} className="flex gap-3">
                <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                <span>
                  <span className="block font-semibold text-ink">{t}</span>
                  <span className="block text-sm text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ul>
          <ContactAside />
        </aside>
      </div>
    </>
  );
}

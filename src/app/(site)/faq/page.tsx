import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/site/PageIntro";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Perguntas frequentes", alternates: { canonical: "/faq" } };

export default async function FaqPage() {
  const s = await getSettings();
  const faqs: [string, React.ReactNode][] = [
    ["Como faço uma compra?", "Escolha os produtos, adicione ao carrinho, informe o CEP para calcular o frete e finalize com Pix, cartão de crédito ou boleto. Você recebe a confirmação por e-mail."],
    ["Quais as formas de pagamento?", `Pix (com ${s.pixDiscountPercent}% de desconto), cartão de crédito em até ${s.maxInstallments}× e boleto bancário. O pagamento é processado em ambiente seguro.`],
    ["Minha instituição compra com CNPJ. Como faço?", <>Você pode finalizar a compra informando o CNPJ ou <Link href="/orcamento">solicitar um orçamento formal</Link>, com valores, prazo e condições para o setor de compras.</>],
    ["Qual o prazo de entrega?", "O prazo aparece no cálculo do frete e soma o tempo de preparo do pedido com o transporte até o seu CEP. Produtos sob encomenda têm o prazo informado na página do produto."],
    ["O que significa “sob encomenda”?", "O produto é produzido ou importado sob pedido. O prazo estimado aparece na página do produto e confirmamos a previsão após a compra."],
    ["Por que alguns produtos são “sob orçamento”?", "Equipamentos de maior valor, muito grandes ou que dependem de configuração são vendidos por proposta, para incluirmos frete, instalação e condições adequadas."],
    ["Os produtos têm garantia?", <>Sim. Os produtos têm garantia contra defeitos de fabricação, com o prazo informado na página de cada item. Veja a <Link href="/garantia">política de garantia</Link>.</>],
    ["Posso trocar ou devolver?", <>Sim. Compras online podem ser canceladas em até 7 dias após o recebimento. Veja a <Link href="/trocas-e-devolucoes">política de trocas e devoluções</Link>.</>],
    ["Vocês emitem nota fiscal?", "Sim. Todas as vendas são acompanhadas de nota fiscal."],
    ["Vocês fazem manutenção de equipamentos comprados em outro lugar?", <>Sim. <Link href="/manutencao">Solicite a manutenção</Link> informando o equipamento e o problema.</>],
  ];
  return (
    <>
      <PageIntro crumb="Perguntas frequentes" title="Perguntas frequentes" />
      <div className="container-site py-10 md:py-14">
        <div className="max-w-3xl divide-y divide-line rounded-[var(--radius-card)] border border-line">
          {faqs.map(([q, a]) => (
            <details key={q} className="group p-5 [&_a]:text-brand [&_a]:underline">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                {q}
                <span className="text-xl text-brand transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <div className="mt-3 text-[15px] text-muted">{a}</div>
            </details>
          ))}
        </div>
        <p className="mt-8 text-muted">
          Não achou sua resposta? <Link href="/contato" className="text-brand underline">Fale com a gente</Link>.
        </p>
      </div>
    </>
  );
}

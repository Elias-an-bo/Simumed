import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  CreditCard,
  MonitorPlay,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import { ProductGrid } from "@/components/product/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getCategoryTree, getFeaturedProducts } from "@/lib/catalog/queries";
import { categoryIcon } from "@/lib/catalog/icons";
import { getSettings } from "@/lib/settings";

export const revalidate = 3600;

export default async function HomePage() {
  const [tree, featured, settings] = await Promise.all([getCategoryTree(), getFeaturedProducts(8), getSettings()]);
  const total = tree.reduce((s, c) => s + c.count, 0);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-surface to-white">
        <div className="container-site grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <p className="badge bg-brand-soft text-brand">Simulação clínica · Anatomia · Microscopia</p>
            <h1 className="mt-5 text-[36px] font-extrabold sm:text-[48px] lg:text-[56px]">
              Equipamentos para formar profissionais de saúde com <span className="text-brand">segurança e realismo</span>
            </h1>
            <p className="mt-5 max-w-xl text-[18px] text-muted">
              Simuladores de enfermagem e medicina, modelos anatômicos, microscópios e softwares de simulação — com
              garantia, envio para todo o Brasil e manutenção técnica especializada.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/produtos" className="btn btn-primary h-12 px-6 text-base">
                Ver catálogo <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/orcamento" className="btn btn-secondary h-12 px-6 text-base">
                Orçamento para instituições
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-line pt-6">
              <div>
                <dt className="text-sm text-muted">Produtos</dt>
                <dd className="num font-[family-name:var(--font-display)] text-2xl font-bold text-ink">{total}+</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Garantia</dt>
                <dd className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink">12 meses</dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Entrega</dt>
                <dd className="font-[family-name:var(--font-display)] text-2xl font-bold text-ink">Todo o Brasil</dd>
              </div>
            </dl>
          </div>
          <HeroVisual categories={tree.slice(0, 6)} />
        </div>
      </section>

      {/* Garantias */}
      <section aria-label="Por que comprar na Simumed" className="border-b border-line">
        <ul className="container-site grid grid-cols-2 gap-x-6 gap-y-5 py-7 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: "Garantia de 12 meses", text: "Contra defeitos de fabricação" },
            { icon: Truck, title: "Envio para todo o Brasil", text: "Frete calculado na hora" },
            { icon: CreditCard, title: "Pix, cartão e boleto", text: `${settings.pixDiscountPercent}% de desconto no Pix` },
            { icon: Building2, title: "Compras com CNPJ", text: "Orçamento formal para instituições" },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-ink">{title}</span>
                <span className="block text-sm text-muted">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Categorias */}
      <section className="container-site py-16 md:py-24">
        <SectionHeading
          eyebrow="Catálogo"
          title="Tudo para o laboratório e o centro de simulação"
          description="Escolha por área de ensino. Cada produto tem ficha técnica, prazo e garantia informados."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tree.map((c) => {
            const Icon = categoryIcon(c.slug);
            return (
              <li key={c.slug}>
                <Link
                  href={`/categoria/${c.slug}`}
                  className="group card flex h-full items-start gap-4 p-6 transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand transition-colors group-hover:bg-brand group-hover:text-white">
                    <Icon className="size-6" strokeWidth={1.6} aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-[family-name:var(--font-display)] text-lg font-bold text-ink">{c.name}</span>
                      <span className="num text-sm text-muted">{c.count}</span>
                    </span>
                    {c.description && <span className="mt-1 block text-[15px] text-muted">{c.description}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Destaques */}
      {featured.length > 0 && (
        <section className="bg-surface py-16 md:py-24">
          <div className="container-site">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading eyebrow="Destaques" title="Mais procurados por escolas e hospitais" />
              <Link href="/produtos" className="btn btn-ghost">
                Ver todos <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-10">
              <ProductGrid products={featured} settings={settings} />
            </div>
          </div>
        </section>
      )}

      {/* Serviços */}
      <section className="container-site py-16 md:py-24">
        <SectionHeading
          eyebrow="Além dos produtos"
          title="Acompanhamos o equipamento depois da compra"
          description="Implantação, treinamento de uso e manutenção para o seu laboratório continuar funcionando."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="card flex flex-col p-7 md:p-9">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-ink text-white">
              <MonitorPlay className="size-6" aria-hidden />
            </span>
            <h3 className="mt-5 text-2xl font-bold">Softwares de simulação realística</h3>
            <p className="mt-3 text-muted">
              Soluções para cenários clínicos, debriefing e treinamento em protocolos de suporte de vida como ACLS e
              ATLS. Indicamos a configuração adequada ao seu centro de simulação.
            </p>
            <Link href="/softwares" className="btn btn-dark mt-6 self-start">
              Conhecer softwares <ArrowRight className="size-4" aria-hidden />
            </Link>
          </article>
          <article className="card flex flex-col p-7 md:p-9">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-white">
              <Wrench className="size-6" aria-hidden />
            </span>
            <h3 className="mt-5 text-2xl font-bold">Manutenção técnica especializada</h3>
            <p className="mt-3 text-muted">
              Manutenção corretiva e preventiva de simuladores, modelos anatômicos, microscópios e softwares de
              simulação. Diagnóstico, orçamento e reparo com acompanhamento.
            </p>
            <Link href="/manutencao" className="btn btn-primary mt-6 self-start">
              Solicitar manutenção <ArrowRight className="size-4" aria-hidden />
            </Link>
          </article>
        </div>
      </section>

      {/* Instituições */}
      <section className="bg-ink py-16 text-white md:py-24">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#5fd3c5]">Compras institucionais</p>
            <h2 className="text-[28px] font-bold text-white sm:text-[36px]">
              Montando ou ampliando um laboratório? Monte a lista e receba uma proposta.
            </h2>
            <p className="mt-4 text-[17px] text-white/70">
              Adicione os produtos ao carrinho e transforme em orçamento com um clique, ou envie a sua lista. Respondemos
              com valores, prazos de entrega e condições de pagamento para CNPJ.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/orcamento" className="btn btn-primary h-12 px-6">
                Solicitar orçamento
              </Link>
              <Link href="/contato" className="btn h-12 border border-white/30 px-6 text-white hover:bg-white/10">
                Falar com a equipe
              </Link>
            </div>
          </div>
          <ol className="grid gap-4">
            {[
              { title: "Envie a lista", text: "Pelo carrinho, pelo formulário ou pelo WhatsApp." },
              { title: "Receba a proposta", text: "Valores, prazos e condições por escrito, com os dados da sua instituição." },
              { title: "Aprovação e entrega", text: "Acompanhamos o pedido até a entrega e ficamos disponíveis no pós-venda." },
            ].map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-5">
                <span className="num flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-bold">{i + 1}</span>
                <span>
                  <span className="flex items-center gap-2 font-semibold text-white">
                    <ClipboardCheck className="size-4 text-[#5fd3c5]" aria-hidden /> {s.title}
                  </span>
                  <span className="mt-1 block text-[15px] text-white/70">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}

function HeroVisual({ categories }: { categories: { slug: string; name: string; count: number }[] }) {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(circle_at_30%_20%,rgb(11_122_114/14%),transparent_60%)]" />
      <div className="card overflow-hidden p-5 shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Centro de simulação</p>
            <p className="font-[family-name:var(--font-display)] text-lg font-bold text-ink">Sinais vitais · cenário RCP</p>
          </div>
          <span className="badge bg-success-soft text-success">
            <span className="size-1.5 animate-pulse rounded-full bg-current" /> Em treino
          </span>
        </div>
        <svg viewBox="0 0 400 110" className="mt-4 h-28 w-full">
          <defs>
            <linearGradient id="ecg" x1="0" x2="1">
              <stop offset="0" stopColor="#0b7a72" stopOpacity="0.15" />
              <stop offset="1" stopColor="#0b7a72" />
            </linearGradient>
          </defs>
          <path d="M0 60h60l10-20 12 46 14-70 12 44h50l10-18 12 42 14-66 12 42h50l10-18 12 42 14-66 12 42h46" fill="none" stroke="url(#ecg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            ["FC", "92", "bpm"],
            ["SpO₂", "97", "%"],
            ["PA", "120/80", "mmHg"],
          ].map(([k, v, u]) => (
            <div key={k} className="rounded-xl bg-surface p-3">
              <p className="text-xs font-semibold text-muted">{k}</p>
              <p className="num font-[family-name:var(--font-display)] text-xl font-bold text-ink">
                {v} <span className="text-xs font-medium text-muted">{u}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-3 gap-3">
        {categories.slice(0, 3).map((c) => {
          const Icon = categoryIcon(c.slug);
          return (
            <li key={c.slug} className="card flex flex-col items-start gap-2 p-4">
              <Icon className="size-5 text-brand" aria-hidden />
              <span className="text-sm font-semibold leading-tight text-ink">{c.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

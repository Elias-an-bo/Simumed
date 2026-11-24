import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, ShieldCheck, Truck, CreditCard } from "lucide-react";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { AvailabilityBadge, availabilityLabel } from "@/components/product/AvailabilityBadge";
import { PriceBlock } from "@/components/product/PriceBlock";
import { ProductGrid } from "@/components/product/ProductCard";
import { ProductVisual } from "@/components/product/ProductVisual";
import { ShippingCalculator } from "@/components/product/ShippingCalculator";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { getProductBySlug, getRelatedProducts, rootCategorySlug } from "@/lib/catalog/queries";
import { sellability } from "@/lib/catalog/sellability";
import { pixPrice } from "@/lib/pricing";
import { getSettings } from "@/lib/settings";

export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return []; // páginas geradas no primeiro acesso e guardadas em cache
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const description =
    p.shortDescription ?? `${p.name}. ${p.category.name} para ensino e treinamento em saúde, com garantia e envio para todo o Brasil.`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/produtos/${p.slug}` },
    openGraph: { title: p.name, description, images: p.images[0] ? [p.images[0].url] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product) notFound();
  const related = await getRelatedProducts(product, 4);
  const sell = sellability(product, settings);
  const root = rootCategorySlug(product);
  const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

  const crumbs = [{ href: "/", label: "Início" }];
  if (product.category.parent) crumbs.push({ href: `/categoria/${product.category.parent.slug}`, label: product.category.parent.name });
  crumbs.push({ href: `/categoria/${product.category.slug}`, label: product.category.name });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    category: product.category.name,
    image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${siteUrl}${i.url}`)),
    description: product.shortDescription ?? product.name,
    brand: { "@type": "Brand", name: "Simumed" },
    ...(sell.mode === "buy"
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "BRL",
            price: (product.priceCents / 100).toFixed(2),
            availability: product.availability === "IN_STOCK" ? "https://schema.org/InStock" : "https://schema.org/PreOrder",
            url: `${siteUrl}/produtos/${product.slug}`,
          },
        }
      : {}),
  };

  const specs: [string, string][] = [
    ["Código", product.sku],
    ["Categoria", product.category.parent ? `${product.category.parent.name} › ${product.category.name}` : product.category.name],
    ["Disponibilidade", availabilityLabel(product.availability, product.leadTimeDays)],
    ["Garantia", `${Math.round(product.warrantyDays / 30)} meses contra defeitos de fabricação`],
  ];
  if (product.lengthCm && product.widthCm && product.heightCm) {
    specs.push(["Embalagem (C × L × A)", `${fmt(product.lengthCm)} × ${fmt(product.widthCm)} × ${fmt(product.heightCm)} cm`]);
  }
  if (product.weightKg) specs.push(["Peso com embalagem", `${fmt(product.weightKg)} kg`]);

  return (
    <div className="container-site py-8 md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs items={[...crumbs, { label: product.name }]} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div className="card aspect-[4/3] overflow-hidden bg-surface lg:sticky lg:top-40 lg:self-start">
          <ProductVisual image={product.images[0]} name={product.name} rootSlug={root} categoryName={product.category.name} size="page" />
        </div>

        <div>
          <AvailabilityBadge availability={product.availability} leadTimeDays={product.leadTimeDays} />
          <h1 className="mt-3 text-[26px] font-bold sm:text-[32px]">{product.name}</h1>
          <p className="mt-2 text-sm text-muted">Código: {product.sku}</p>

          <div className="mt-6 border-y border-line py-6">
            <PriceBlock
              priceCents={product.priceCents}
              sell={sell}
              pixDiscountPercent={settings.pixDiscountPercent}
              maxInstallments={settings.maxInstallments}
              size="page"
            />
          </div>

          <div className="mt-6 space-y-4">
            {sell.mode === "buy" ? (
              <>
                <AddToCartButton
                  item={{
                    productId: product.id,
                    slug: product.slug,
                    name: product.name,
                    priceCents: product.priceCents,
                    image: product.images[0]?.url ?? null,
                    rootSlug: root,
                    categoryName: product.category.name,
                  }}
                />
                {product.freightOnRequest ? (
                  <p className="rounded-[var(--radius-control)] bg-warn-soft p-3 text-sm text-warn">
                    Produto grande ou pesado: o frete é calculado sob consulta. Ao finalizar, enviaremos a proposta de entrega.
                  </p>
                ) : (
                  <ShippingCalculator items={[{ productId: product.id, quantity: 1 }]} />
                )}
              </>
            ) : (
              <Link href={`/orcamento?produto=${product.slug}`} className="btn btn-primary h-12 w-full text-base">
                <FileText className="size-5" aria-hidden /> Solicitar orçamento
              </Link>
            )}
            <Link href={`/orcamento?produto=${product.slug}`} className={sell.mode === "buy" ? "block text-center text-sm font-semibold text-brand hover:underline" : "hidden"}>
              Compra institucional? Solicite um orçamento com CNPJ
            </Link>
          </div>

          <ul className="mt-8 grid gap-3 rounded-[var(--radius-card)] bg-surface p-5 text-[15px]">
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-5 shrink-0 text-brand" aria-hidden /> Garantia de {Math.round(product.warrantyDays / 30)} meses
            </li>
            <li className="flex items-center gap-3">
              <Truck className="size-5 shrink-0 text-brand" aria-hidden /> Envio para todo o Brasil com rastreamento
            </li>
            <li className="flex items-center gap-3">
              <CreditCard className="size-5 shrink-0 text-brand" aria-hidden />
              {sell.mode === "buy" && settings.pixDiscountPercent > 0
                ? `Pix com ${settings.pixDiscountPercent}% de desconto (${(pixPrice(product.priceCents, settings.pixDiscountPercent) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}), cartão ou boleto`
                : "Pix, cartão ou boleto"}
            </li>
          </ul>
        </div>
      </div>

      <section className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        <div>
          <h2 className="text-2xl font-bold">Descrição</h2>
          <div className="prose-simumed mt-4 text-[16px] text-text">
            {product.description ? (
              product.description.split(/\n{2,}/).map((para, i) => <p key={i}>{para}</p>)
            ) : (
              <>
                <p>
                  {product.name}. Produto da linha <strong>{product.category.name}</strong>, indicado para o ensino e o treinamento
                  prático em cursos de saúde, laboratórios e centros de simulação.
                </p>
                <p>
                  Precisa da ficha técnica completa, de fotos adicionais ou de uma proposta para sua instituição?{" "}
                  <Link href={`/orcamento?produto=${product.slug}`}>Fale com a nossa equipe</Link>.
                </p>
              </>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">Especificações</h2>
          <dl className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line">
            {specs.map(([k, v]) => (
              <div key={k} className="grid gap-1 px-4 py-3 text-[15px] sm:grid-cols-[190px_1fr] sm:gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Produtos relacionados</h2>
          <ProductGrid products={related} settings={settings} />
        </section>
      )}
    </div>
  );
}

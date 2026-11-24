import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTitle, Notice } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { prisma } from "@/lib/db";
import { deleteProductImageAction, makeImageMainAction, saveProductAction } from "../../../actions";
import { categoryOptions, centsToInput } from "../data";

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [p, categories, settings] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } } } }),
    categoryOptions(),
    prisma.settings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } }),
  ]);
  if (!p) notFound();
  return (
    <>
      <AdminTitle title={p.name} back={{ href: "/admin/produtos", label: "Produtos" }}>
        <Link href={`/produtos/${p.slug}`} target="_blank" className="btn btn-secondary h-10 min-h-0">Ver na loja</Link>
      </AdminTitle>
      {sp.ok && <Notice>Produto criado.</Notice>}
      <p className="mb-5 text-sm text-muted">
        SKU {p.sku}{p.supplierCode ? ` · código do fornecedor ${p.supplierCode}` : ""}{p.dimsEstimated ? " · ⚠ medidas estimadas — confira peso e caixa" : ""}
      </p>
      {p.images.length > 0 && (
        <section className="card mb-6 p-5">
          <h2 className="text-lg font-bold">Fotos atuais</h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {p.images.map((img, i) => (
              <li key={img.id} className="w-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="aspect-square w-full rounded-lg border border-line bg-white object-contain" />
                <div className="mt-1 flex justify-between text-xs">
                  {i === 0 ? <span className="font-semibold text-brand">Principal</span> : (
                    <form action={makeImageMainAction.bind(null, img.id)}><button className="text-brand underline" type="submit">Principal</button></form>
                  )}
                  <form action={deleteProductImageAction.bind(null, img.id)}><button className="text-danger underline" type="submit">Remover</button></form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ProductForm
        isNew={false}
        action={saveProductAction.bind(null, p.id)}
        categories={categories}
        storeMarkup={settings.defaultMarkupPercent}
        pixDiscountPercent={settings.pixDiscountPercent}
        quoteThresholdCents={settings.quoteThresholdCents}
        values={{
          name: p.name, shortDescription: p.shortDescription ?? "", description: p.description ?? "", categoryId: p.categoryId,
          cost: p.costCents ? centsToInput(p.costCents) : "", markupPercent: p.markupPercent == null ? "" : String(p.markupPercent),
          availability: p.availability, leadTimeDays: p.leadTimeDays == null ? "" : String(p.leadTimeDays),
          weightKg: String(p.weightKg), lengthCm: String(p.lengthCm), widthCm: String(p.widthCm), heightCm: String(p.heightCm),
          warrantyDays: String(p.warrantyDays), active: p.active, featured: p.featured, quoteOnly: p.quoteOnly, freightOnRequest: p.freightOnRequest,
        }}
      />
    </>
  );
}

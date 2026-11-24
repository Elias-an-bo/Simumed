import Link from "next/link";
import type { PublicProduct } from "@/lib/catalog/queries";
import { rootCategorySlug } from "@/lib/catalog/queries";
import { sellability } from "@/lib/catalog/sellability";
import type { StoreSettings } from "@/lib/settings";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { PriceBlock } from "./PriceBlock";
import { ProductVisual } from "./ProductVisual";

export function ProductCard({ product, settings }: { product: PublicProduct; settings: StoreSettings }) {
  const sell = sellability(product, settings);
  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group card flex h-full flex-col overflow-hidden transition-shadow duration-200 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="aspect-[4/3] overflow-hidden bg-surface">
        <ProductVisual
          image={product.images[0]}
          name={product.name}
          rootSlug={rootCategorySlug(product)}
          categoryName={product.category.name}
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <AvailabilityBadge availability={product.availability} leadTimeDays={product.leadTimeDays} />
        <h3 className="line-clamp-2 font-[family-name:var(--font-sans)] text-[15px] font-semibold leading-snug tracking-normal text-ink group-hover:text-brand">
          {product.name}
        </h3>
        <div className="mt-auto">
          <PriceBlock
            priceCents={product.priceCents}
            sell={sell}
            pixDiscountPercent={settings.pixDiscountPercent}
            maxInstallments={settings.maxInstallments}
          />
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products, settings }: { products: PublicProduct[]; settings: StoreSettings }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} settings={settings} />
        </li>
      ))}
    </ul>
  );
}

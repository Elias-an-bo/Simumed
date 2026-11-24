import { AdminTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { prisma } from "@/lib/db";
import { saveProductAction } from "../../../actions";
import { categoryOptions } from "../data";

export default async function NewProduct() {
  const [categories, settings] = await Promise.all([categoryOptions(), prisma.settings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } })]);
  return (
    <>
      <AdminTitle title="Novo produto" back={{ href: "/admin/produtos", label: "Produtos" }} />
      <ProductForm
        isNew
        action={saveProductAction.bind(null, null)}
        categories={categories}
        storeMarkup={settings.defaultMarkupPercent}
        pixDiscountPercent={settings.pixDiscountPercent}
        quoteThresholdCents={settings.quoteThresholdCents}
        values={{
          name: "", shortDescription: "", description: "", categoryId: categories[0]?.id ?? "", cost: "", markupPercent: "",
          availability: "IN_STOCK", leadTimeDays: "", weightKg: "", lengthCm: "", widthCm: "", heightCm: "", warrantyDays: "365",
          active: true, featured: false, quoteOnly: false, freightOnRequest: false,
        }}
      />
    </>
  );
}

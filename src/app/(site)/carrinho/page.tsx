import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Carrinho", robots: { index: false } };

export default async function CartPage() {
  const s = await getSettings();
  return (
    <div className="container-site py-8 md:py-12">
      <h1 className="text-[30px] font-bold sm:text-[36px]">Carrinho</h1>
      <CartView pixDiscountPercent={s.pixDiscountPercent} maxInstallments={s.maxInstallments} />
    </div>
  );
}

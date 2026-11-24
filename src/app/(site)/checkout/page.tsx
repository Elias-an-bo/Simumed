import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage() {
  const s = await getSettings();
  return (
    <div className="container-site py-8 md:py-12">
      <h1 className="text-[30px] font-bold sm:text-[36px]">Finalizar compra</h1>
      <CheckoutForm
        pixDiscountPercent={s.pixDiscountPercent}
        maxInstallments={s.maxInstallments}
        provider={process.env.PAYMENT_PROVIDER === "mercadopago" ? "mercadopago" : "fake"}
        publicKey={process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? null}
      />
    </div>
  );
}

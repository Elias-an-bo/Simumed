import { formatBRL } from "@/lib/money";
import { pixPrice } from "@/lib/pricing";
import type { Sellability } from "@/lib/catalog/sellability";

export function PriceBlock({
  priceCents,
  sell,
  pixDiscountPercent,
  maxInstallments,
  size = "card",
}: {
  priceCents: number;
  sell: Sellability;
  pixDiscountPercent: number;
  maxInstallments: number;
  size?: "card" | "page";
}) {
  if (sell.mode !== "buy") {
    return (
      <div>
        <p className={size === "page" ? "text-2xl font-bold text-ink" : "text-lg font-bold text-ink"}>Sob orçamento</p>
        <p className="text-sm text-muted">Proposta com prazo e condições para instituições</p>
      </div>
    );
  }
  const pix = pixPrice(priceCents, pixDiscountPercent);
  return (
    <div className="num">
      <p className={size === "page" ? "text-[34px] font-bold leading-tight text-ink" : "text-xl font-bold text-ink"}>
        {formatBRL(priceCents)}
      </p>
      {pixDiscountPercent > 0 && (
        <p className={size === "page" ? "text-base text-text" : "text-sm text-text"}>
          <strong className="text-brand">{formatBRL(pix)}</strong> no Pix
          {size === "page" && <span className="text-muted"> ({pixDiscountPercent}% de desconto)</span>}
        </p>
      )}
      {maxInstallments > 1 && <p className="text-sm text-muted">ou em até {maxInstallments}× no cartão</p>}
    </div>
  );
}

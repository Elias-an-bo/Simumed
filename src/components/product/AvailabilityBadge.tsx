type Availability = "IN_STOCK" | "ON_ORDER" | "ON_REQUEST";

export function availabilityLabel(a: Availability, leadTimeDays?: number | null): string {
  if (a === "IN_STOCK") return "Pronta entrega";
  if (a === "ON_ORDER") return leadTimeDays ? `Sob encomenda · até ${leadTimeDays} dias` : "Sob encomenda";
  return "Sob consulta";
}

export function AvailabilityBadge({ availability, leadTimeDays }: { availability: Availability; leadTimeDays?: number | null }) {
  const style =
    availability === "IN_STOCK"
      ? "bg-success-soft text-success"
      : availability === "ON_ORDER"
        ? "bg-warn-soft text-warn"
        : "bg-surface text-muted";
  return (
    <span className={`badge ${style}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {availabilityLabel(availability, leadTimeDays)}
    </span>
  );
}

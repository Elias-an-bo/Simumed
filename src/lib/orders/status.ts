export type OrderStatusValue = "PENDING_PAYMENT" | "PAID" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELED";

/** Status de pagamento normalizado (padrão do Mercado Pago). */
export type PaymentStatusValue =
  | "approved"
  | "pending"
  | "in_process"
  | "authorized"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "charged_back"
  | (string & {});

export const ORDER_STATUS_LABEL: Record<OrderStatusValue, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  PAID: "Pagamento aprovado",
  PREPARING: "Em preparação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELED: "Cancelado",
};

/**
 * Próximo status do pedido diante de uma atualização de pagamento.
 * Nunca rebaixa um pedido pago; recusa/cancelamento do pagamento deixa o pedido aguardando (o cliente pode pagar de novo).
 */
export function nextStatusFor(current: OrderStatusValue, payment: PaymentStatusValue): OrderStatusValue {
  if (payment === "refunded" || payment === "charged_back") return "CANCELED";
  if (current === "CANCELED") return "CANCELED";
  if (payment === "approved" && current === "PENDING_PAYMENT") return "PAID";
  return current;
}

/** Linha do carrinho guardada no navegador. Preço é só para exibição: o servidor sempre reprecifica. */
export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  quantity: number;
  image: string | null;
  rootSlug: string;
  categoryName: string;
}

export const MAX_QTY = 99;

export function clampQty(q: number): number {
  if (!Number.isFinite(q)) return 1;
  return Math.min(MAX_QTY, Math.max(1, Math.floor(q)));
}

export function addLine(lines: CartLine[], item: Omit<CartLine, "quantity">, qty: number): CartLine[] {
  const existing = lines.find((l) => l.productId === item.productId);
  if (existing) {
    return lines.map((l) => (l.productId === item.productId ? { ...l, ...item, quantity: clampQty(l.quantity + qty) } : l));
  }
  return [...lines, { ...item, quantity: clampQty(qty) }];
}

export function setLineQuantity(lines: CartLine[], productId: string, qty: number): CartLine[] {
  if (qty <= 0) return removeLine(lines, productId);
  return lines.map((l) => (l.productId === productId ? { ...l, quantity: clampQty(qty) } : l));
}

export function removeLine(lines: CartLine[], productId: string): CartLine[] {
  return lines.filter((l) => l.productId !== productId);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.quantity, 0);
}

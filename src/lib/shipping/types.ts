export interface ShippingItem {
  id: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  /** valor segurado por unidade, em centavos */
  insuranceCents: number;
  quantity: number;
}

export interface ShippingOption {
  id: string;
  name: string;
  company: string;
  priceCents: number;
  /** prazo total em dias úteis (preparo + transporte) */
  days: number;
}

export interface ShippingProvider {
  quote(input: { fromCep: string; toCep: string; items: ShippingItem[]; handlingDays: number }): Promise<ShippingOption[]>;
}

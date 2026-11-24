export type PaymentMethodValue = "PIX" | "CARD" | "BOLETO";

export interface PaymentOrder {
  id: string;
  number: number;
  totalCents: number;
  customerName: string;
  customerEmail: string;
  customerDocument: string;
  cep: string;
  street: string;
  streetNumber: string;
  district: string;
  city: string;
  state: string;
}

export interface CardData {
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string | null;
}

export interface PaymentResult {
  providerId: string;
  status: string;
  statusDetail?: string;
  pix?: { qrCode: string; qrCodeBase64: string; expiresAt: Date | null };
  boletoUrl?: string;
}

export interface PaymentProvider {
  name: string;
  createPayment(order: PaymentOrder, method: PaymentMethodValue, card?: CardData, attempt?: number): Promise<PaymentResult>;
  getPayment(id: string): Promise<{ id: string; status: string; statusDetail?: string; externalReference?: string | null }>;
}

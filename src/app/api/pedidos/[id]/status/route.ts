import { NextResponse } from "next/server";
import { getOrderWithToken } from "@/lib/orders/access";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderWithToken(id, new URL(req.url).searchParams.get("t"));
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  return NextResponse.json({ status: order.status, paymentStatus: order.paymentStatus, updatedAt: order.updatedAt });
}

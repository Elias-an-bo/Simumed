import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Clock, Package, Truck, XCircle } from "lucide-react";
import { CopyButton, FakePayButton, OrderPoller, RetryPayment } from "@/components/checkout/OrderLive";
import { formatCep } from "@/lib/cep";
import { formatDocument } from "@/lib/documents";
import { formatBRL } from "@/lib/money";
import { getOrderWithToken } from "@/lib/orders/access";
import { ORDER_STATUS_LABEL } from "@/lib/orders/status";
import { getSettings, whatsappLink } from "@/lib/settings";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false } };
export const dynamic = "force-dynamic";

const STEPS = ["PENDING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED"] as const;
const METHOD_LABEL = { PIX: "Pix", CARD: "Cartão de crédito", BOLETO: "Boleto" } as const;

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const [{ id }, { t }] = await Promise.all([params, searchParams]);
  const order = await getOrderWithToken(id, t);
  if (!order) notFound();
  const s = await getSettings();
  const provider = process.env.PAYMENT_PROVIDER === "mercadopago" ? "mercadopago" : "fake";
  const pending = order.status === "PENDING_PAYMENT";
  const rejected = pending && (order.paymentStatus === "rejected" || order.paymentStatus === "cancelled" || !order.paymentId);
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const wa = whatsappLink(s.whatsapp, `Olá! Tenho uma dúvida sobre o pedido nº ${order.number}.`);

  return (
    <div className="container-site py-8 md:py-12">
      <OrderPoller id={order.id} token={order.accessToken} status={order.status} />
      <p className="text-sm text-muted">Pedido nº {order.number}</p>
      <h1 className="mt-1 text-[28px] font-bold sm:text-[34px]">
        {order.status === "CANCELED"
          ? "Pedido cancelado"
          : pending
            ? rejected
              ? "Pagamento não concluído"
              : "Pedido recebido! Falta pagar"
            : "Obrigado pela compra!"}
      </h1>

      {order.status !== "CANCELED" && (
        <ol className="mt-6 grid grid-cols-5 gap-2" aria-label="Andamento do pedido">
          {STEPS.map((st, i) => (
            <li key={st} className="flex flex-col gap-2">
              <span className={`h-1.5 rounded-full ${i <= stepIndex ? "bg-brand" : "bg-line"}`} />
              <span className={`text-xs sm:text-sm ${i <= stepIndex ? "font-semibold text-ink" : "text-muted"}`}>{ORDER_STATUS_LABEL[st]}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          {pending && !rejected && order.paymentMethod === "PIX" && order.pixQrCode && (
            <section className="card grid gap-6 p-6 sm:grid-cols-[220px_1fr]">
              {order.pixQrCodeBase64 && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`data:image/png;base64,${order.pixQrCodeBase64}`} alt="QR Code do Pix" className="mx-auto size-[220px] rounded-xl border border-line bg-white p-2" />
              )}
              <div>
                <h2 className="text-xl font-bold">Pague com Pix</h2>
                <p className="mt-2 text-[15px] text-muted">
                  Abra o app do seu banco, escolha Pix e leia o QR Code ou use o código copia e cola. Valor: <strong className="text-ink">{formatBRL(order.totalCents)}</strong>.
                </p>
                {order.pixExpiresAt && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-warn">
                    <Clock className="size-4" aria-hidden /> Válido até {order.pixExpiresAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" })}
                  </p>
                )}
                <label htmlFor="pix-code" className="label mt-4">Pix copia e cola</label>
                <textarea id="pix-code" readOnly rows={3} className="field font-mono text-xs" value={order.pixQrCode} />
                <div className="mt-3">
                  <CopyButton text={order.pixQrCode} />
                </div>
                <p className="mt-3 text-sm text-muted">Esta página atualiza sozinha quando o pagamento for confirmado.</p>
                {provider === "fake" && <FakePayButton id={order.id} token={order.accessToken} />}
              </div>
            </section>
          )}

          {pending && !rejected && order.paymentMethod === "BOLETO" && order.boletoUrl && (
            <section className="card p-6">
              <h2 className="text-xl font-bold">Pague o boleto</h2>
              <p className="mt-2 text-[15px] text-muted">O boleto vence em 3 dias. Após o pagamento, a compensação leva até 3 dias úteis.</p>
              <a href={order.boletoUrl} target="_blank" rel="noopener" className="btn btn-primary mt-4">
                Abrir boleto
              </a>
              {provider === "fake" && <FakePayButton id={order.id} token={order.accessToken} />}
            </section>
          )}

          {pending && !rejected && order.paymentMethod === "CARD" && (
            <section className="card flex items-start gap-3 p-6">
              <Clock className="mt-0.5 size-6 text-warn" aria-hidden />
              <p className="text-[15px]">O pagamento com cartão está em análise. Avisaremos por e-mail assim que for aprovado.</p>
            </section>
          )}

          {rejected && (
            <section className="card border-warn/40 p-6">
              <p className="flex items-start gap-3 text-[15px]">
                <XCircle className="mt-0.5 size-6 shrink-0 text-danger" aria-hidden />
                O pagamento não foi aprovado. Seu pedido continua reservado: escolha outra forma de pagamento.
              </p>
              <RetryPayment
                id={order.id}
                token={order.accessToken}
                provider={provider}
                publicKey={process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY ?? null}
                maxInstallments={s.maxInstallments}
                email={order.customerEmail}
                totalWithoutDiscountCents={order.subtotalCents + order.shippingCents}
                pixDiscountPercent={s.pixDiscountPercent}
              />
            </section>
          )}

          {!pending && order.status !== "CANCELED" && (
            <section className="card flex items-start gap-3 p-6">
              {order.status === "SHIPPED" || order.status === "DELIVERED" ? (
                <Truck className="mt-0.5 size-6 text-brand" aria-hidden />
              ) : order.status === "PREPARING" ? (
                <Package className="mt-0.5 size-6 text-brand" aria-hidden />
              ) : (
                <CheckCircle2 className="mt-0.5 size-6 text-success" aria-hidden />
              )}
              <div className="text-[15px]">
                <p className="font-semibold text-ink">{ORDER_STATUS_LABEL[order.status]}</p>
                <p className="mt-1 text-muted">
                  {order.trackingCode ? (
                    <>
                      Código de rastreamento: <strong className="text-ink">{order.trackingCode}</strong>
                    </>
                  ) : (
                    `Enviaremos o código de rastreamento para ${order.customerEmail} assim que o pedido for despachado.`
                  )}
                </p>
              </div>
            </section>
          )}

          <section className="card p-6">
            <h2 className="text-lg font-bold">Entrega</h2>
            <p className="mt-2 text-[15px] text-text">
              {order.customerName}
              {order.companyName ? ` — ${order.companyName}` : ""}
              <br />
              {order.street}, {order.streetNumber}
              {order.complement ? ` — ${order.complement}` : ""}
              <br />
              {order.district} · {order.city}/{order.state} · CEP {formatCep(order.cep)}
            </p>
            <p className="mt-3 text-sm text-muted">
              {order.shippingName} ({order.shippingCompany}) · até {order.shippingDays} dias úteis após a confirmação do pagamento
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="text-lg font-bold">Resumo</h2>
            <ul className="mt-4 space-y-3">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-3 text-sm">
                  <span className="num font-semibold text-muted">{i.quantity}×</span>
                  <span className="flex-1 text-ink">{i.name}</span>
                  <span className="num whitespace-nowrap">{formatBRL(i.unitPriceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="num mt-4 space-y-2 border-t border-line pt-4 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd>{formatBRL(order.subtotalCents)}</dd>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between text-brand">
                  <dt>Desconto Pix</dt>
                  <dd>− {formatBRL(order.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Frete</dt>
                <dd>{formatBRL(order.shippingCents)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-lg font-bold text-ink">
                <dt>Total</dt>
                <dd>{formatBRL(order.totalCents)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-sm text-muted">
              {METHOD_LABEL[order.paymentMethod]}
              {order.paymentMethod === "CARD" && order.installments > 1 ? ` em ${order.installments}×` : ""} · CPF/CNPJ {formatDocument(order.customerDocument)}
            </p>
          </div>
          <div className="card p-5 text-[15px]">
            <p className="font-semibold text-ink">Dúvidas sobre o pedido?</p>
            <p className="mt-1 text-muted">
              {wa ? (
                <a href={wa} target="_blank" rel="noopener" className="text-brand underline">
                  Fale no WhatsApp
                </a>
              ) : (
                <Link href="/contato" className="text-brand underline">
                  Fale com a gente
                </Link>
              )}{" "}
              informando o número {order.number}.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

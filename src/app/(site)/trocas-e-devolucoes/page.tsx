import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Trocas e devoluções", alternates: { canonical: "/trocas-e-devolucoes" } };

export default function ReturnsPage() {
  return (
    <TextPage crumb="Trocas e devoluções" title="Trocas e devoluções" updated="novembro de 2026">
      <h2>Direito de arrependimento</h2>
      <p>
        Nas compras feitas pela internet, você pode desistir em até 7 (sete) dias corridos a partir do recebimento, conforme o
        artigo 49 do Código de Defesa do Consumidor. O produto deve ser devolvido sem sinais de uso, com todos os acessórios,
        manuais e, de preferência, na embalagem original.
      </p>
      <p>
        Para solicitar, <Link href="/contato">entre em contato</Link> informando o número do pedido. Enviamos as instruções de
        devolução sem custo para você. O reembolso é feito pela mesma forma de pagamento após o recebimento e a conferência do
        produto.
      </p>
      <h2>Produto com defeito</h2>
      <p>
        Se o produto apresentar defeito de fabricação, ele é coberto pela <Link href="/garantia">garantia</Link>. Fale com a gente
        com fotos ou vídeo do problema para agilizar o atendimento.
      </p>
      <h2>Produto diferente do pedido ou avariado no transporte</h2>
      <p>Avise em até 7 dias após o recebimento. Faremos a troca ou o reembolso, sem custo para você.</p>
    </TextPage>
  );
}

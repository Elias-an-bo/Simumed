import type { Metadata } from "next";
import { TextPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Entrega e frete", alternates: { canonical: "/entrega" } };

export default function ShippingPage() {
  return (
    <TextPage crumb="Entrega e frete" title="Entrega e frete" updated="novembro de 2026">
      <h2>Para onde entregamos</h2>
      <p>Entregamos em todo o Brasil pelos Correios e por transportadoras parceiras.</p>
      <h2>Como o frete é calculado</h2>
      <p>
        O valor e o prazo são calculados automaticamente pelo CEP de entrega, com base no peso, nas medidas e no valor dos produtos.
        Você escolhe a opção de entrega antes de pagar.
      </p>
      <h2>Prazo de entrega</h2>
      <p>
        O prazo informado soma o tempo de preparo do pedido com o tempo de transporte e começa a contar após a confirmação do
        pagamento. Produtos sob encomenda têm o prazo de disponibilidade indicado na página do produto.
      </p>
      <h2>Produtos grandes ou pesados</h2>
      <p>
        Alguns itens, como manequins de corpo inteiro, têm frete sob consulta. Nesses casos enviamos uma proposta com a melhor
        opção de transporte até a sua instituição.
      </p>
      <h2>Rastreamento</h2>
      <p>Quando o pedido é enviado, você recebe por e-mail o código de rastreamento.</p>
      <h2>No recebimento</h2>
      <p>
        Confira a embalagem na entrega. Se houver avaria aparente, recuse o recebimento ou registre a ocorrência com o entregador e
        nos avise em até 48 horas, com fotos.
      </p>
    </TextPage>
  );
}

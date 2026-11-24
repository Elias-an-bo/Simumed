import type { Metadata } from "next";
import { TextPage } from "@/components/site/LegalPage";
import { formatDocument } from "@/lib/documents";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Termos de uso", alternates: { canonical: "/termos" } };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <TextPage crumb="Termos de uso" title="Termos de uso" updated="novembro de 2026">
      <p>
        Este site é operado por {s.legalName ?? s.companyName}
        {s.cnpj ? `, CNPJ ${formatDocument(s.cnpj)}` : ""}
        {s.address ? `, com endereço em ${s.address}` : ""}. Ao usar o site e fazer pedidos, você concorda com estes termos.
      </p>
      <h2>Preços e disponibilidade</h2>
      <p>
        Os preços são válidos para compras pelo site e podem mudar sem aviso, sem afetar pedidos já pagos. Em caso de erro evidente
        de preço ou de indisponibilidade após a compra, entraremos em contato para oferecer alternativas ou o reembolso integral.
      </p>
      <h2>Pedidos</h2>
      <p>
        O pedido é confirmado após a aprovação do pagamento. Podemos cancelar pedidos com indícios de fraude, com o reembolso
        integral do valor pago.
      </p>
      <h2>Conteúdo</h2>
      <p>
        Imagens e descrições são ilustrativas e podem apresentar pequenas variações em relação ao produto entregue, sem prejuízo das
        especificações informadas.
      </p>
      <h2>Contato</h2>
      <p>Dúvidas sobre estes termos podem ser enviadas pela página de contato.</p>
    </TextPage>
  );
}

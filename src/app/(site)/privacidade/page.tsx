import type { Metadata } from "next";
import { TextPage } from "@/components/site/LegalPage";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Política de privacidade", alternates: { canonical: "/privacidade" } };

export default async function PrivacyPage() {
  const s = await getSettings();
  return (
    <TextPage crumb="Privacidade" title="Política de privacidade" updated="novembro de 2026">
      <p>
        Esta política explica como a {s.legalName ?? s.companyName} trata os dados pessoais de quem usa este site, de acordo com a
        Lei Geral de Proteção de Dados (Lei 13.709/2018).
      </p>
      <h2>Quais dados coletamos</h2>
      <ul>
        <li>Dados de cadastro e entrega: nome, CPF ou CNPJ, e-mail, telefone e endereço, informados por você na compra.</li>
        <li>Dados de solicitações: o que você escreve nos formulários de orçamento, manutenção e contato.</li>
        <li>Dados de pagamento: processados diretamente pelo intermediador de pagamento. Não armazenamos dados de cartão.</li>
        <li>Dados técnicos mínimos, como endereço IP, para segurança e prevenção a fraudes.</li>
      </ul>
      <h2>Para que usamos</h2>
      <ul>
        <li>Processar pedidos, emitir nota fiscal, entregar e prestar suporte.</li>
        <li>Responder orçamentos, pedidos de manutenção e mensagens.</li>
        <li>Cumprir obrigações legais e fiscais.</li>
      </ul>
      <h2>Com quem compartilhamos</h2>
      <p>
        Somente com quem é necessário para concluir o seu pedido: intermediador de pagamento, transportadoras e Correios, e o
        serviço de envio de e-mails. Não vendemos dados pessoais.
      </p>
      <h2>Armazenamento no navegador</h2>
      <p>
        O carrinho e o último CEP consultado ficam salvos no seu próprio navegador para facilitar a compra. Não usamos cookies de
        publicidade.
      </p>
      <h2>Seus direitos</h2>
      <p>
        Você pode pedir acesso, correção ou exclusão dos seus dados, ressalvadas as informações que a lei nos obriga a guardar.
        {s.email ? ` Escreva para ${s.email}.` : " Use a página de contato."}
      </p>
    </TextPage>
  );
}

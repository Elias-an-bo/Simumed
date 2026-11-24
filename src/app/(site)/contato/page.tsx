import type { Metadata } from "next";
import { RequestForm } from "@/components/forms/RequestForm";
import { ContactAside } from "@/components/site/ContactAside";
import { PageIntro } from "@/components/site/PageIntro";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a Simumed: dúvidas sobre produtos, pedidos, orçamentos e manutenção.",
  alternates: { canonical: "/contato" },
};

export default function ContactPage() {
  return (
    <>
      <PageIntro crumb="Contato" title="Fale com a Simumed" description="Dúvidas sobre produtos, pedidos, prazos ou manutenção? Escreva para nós." />
      <div className="container-site grid gap-8 py-10 lg:grid-cols-[1fr_340px] lg:py-14">
        <RequestForm type="CONTACT" submitLabel="Enviar mensagem" />
        <aside>
          <ContactAside title="Outros canais" />
        </aside>
      </div>
    </>
  );
}

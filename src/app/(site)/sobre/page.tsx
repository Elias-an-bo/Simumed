import type { Metadata } from "next";
import Link from "next/link";
import { TextPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Sobre a Simumed", alternates: { canonical: "/sobre" } };

export default function AboutPage() {
  return (
    <TextPage crumb="Sobre" title="Sobre a Simumed" description="Equipamentos de ensino em saúde com atendimento próximo, do orçamento à manutenção.">
      <p>
        A Simumed fornece simuladores de enfermagem e medicina, modelos anatômicos, microscópios, lâminas preparadas e softwares de
        simulação para faculdades, escolas técnicas, hospitais e centros de simulação de todo o Brasil.
      </p>
      <p>
        Nosso trabalho não termina na entrega. Ajudamos a especificar o equipamento certo para cada disciplina, orientamos a
        instalação e o uso e oferecemos manutenção técnica para que o laboratório continue funcionando ao longo dos anos.
      </p>
      <h2>Como trabalhamos</h2>
      <ul>
        <li>Catálogo com ficha técnica, prazo e garantia informados em cada produto.</li>
        <li>Compra online com Pix, cartão ou boleto, ou proposta formal para instituições.</li>
        <li>Envio para todo o Brasil com rastreamento.</li>
        <li>Manutenção corretiva e preventiva de simuladores, modelos, microscópios e softwares.</li>
      </ul>
      <p>
        Quer montar ou ampliar um laboratório? <Link href="/orcamento">Solicite um orçamento</Link> ou{" "}
        <Link href="/contato">fale com a nossa equipe</Link>.
      </p>
    </TextPage>
  );
}

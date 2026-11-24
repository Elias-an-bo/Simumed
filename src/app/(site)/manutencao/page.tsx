import type { Metadata } from "next";
import { Bone, Microscope, MonitorCog, Stethoscope } from "lucide-react";
import { RequestForm } from "@/components/forms/RequestForm";
import { ContactAside } from "@/components/site/ContactAside";
import { PageIntro } from "@/components/site/PageIntro";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Manutenção técnica",
  description: "Manutenção corretiva e preventiva de simuladores, modelos anatômicos, microscópios e softwares de simulação.",
  alternates: { canonical: "/manutencao" },
};

const AREAS = [
  { icon: Stethoscope, t: "Simuladores", d: "Diagnóstico eletrônico e mecânico, troca de peles, veias e componentes, calibração de sensores e monitores." },
  { icon: Bone, t: "Modelos anatômicos", d: "Reparo de peças, encaixes e suportes, reposição de partes e restauração de pintura." },
  { icon: Microscope, t: "Microscópios", d: "Limpeza e alinhamento óptico, revisão mecânica, troca de lâmpadas e LEDs, ajuste de foco e platina." },
  { icon: MonitorCog, t: "Softwares de simulação", d: "Instalação, atualização, configuração de cenários e suporte ao uso no centro de simulação." },
];

export default function MaintenancePage() {
  return (
    <>
      <PageIntro
        crumb="Manutenção"
        eyebrow="Assistência técnica"
        title="Manutenção para o seu laboratório não parar"
        description="Manutenção corretiva e preventiva de simuladores, modelos anatômicos, microscópios e softwares de simulação — inclusive de equipamentos comprados em outros fornecedores."
      />
      <section className="container-site py-12 md:py-16">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {AREAS.map(({ icon: Icon, t, d }) => (
            <li key={t} className="card p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Icon className="size-5" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-bold">{t}</h2>
              <p className="mt-2 text-[15px] text-muted">{d}</p>
            </li>
          ))}
        </ul>
      </section>
      <section className="bg-surface py-12 md:py-16">
        <div className="container-site">
          <SectionHeading eyebrow="Como funciona" title="Do pedido ao equipamento funcionando" />
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Envie a solicitação", "Conte qual é o equipamento e o problema. Fotos e vídeos ajudam no diagnóstico."],
              ["Diagnóstico e orçamento", "Avaliamos e enviamos o orçamento com prazo, informando se o atendimento é no local ou com envio do equipamento."],
              ["Reparo e testes", "Após a aprovação, fazemos o reparo, testamos e devolvemos o equipamento pronto para uso."],
            ].map(([t, d], i) => (
              <li key={t} className="card flex gap-4 p-6">
                <span className="num flex size-9 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
                <span>
                  <span className="block font-semibold text-ink">{t}</span>
                  <span className="mt-1 block text-[15px] text-muted">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section id="solicitar" className="container-site grid gap-8 py-12 md:py-16 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="mb-6 text-2xl font-bold">Solicitar manutenção</h2>
          <RequestForm type="MAINTENANCE" submitLabel="Solicitar manutenção" />
        </div>
        <aside className="lg:pt-14">
          <ContactAside title="Atendimento técnico" />
        </aside>
      </section>
    </>
  );
}

import type { Metadata } from "next";
import { Activity, HeartPulse, ShieldPlus, Video } from "lucide-react";
import { RequestForm } from "@/components/forms/RequestForm";
import { ContactAside } from "@/components/site/ContactAside";
import { PageIntro } from "@/components/site/PageIntro";

export const metadata: Metadata = {
  title: "Softwares de simulação",
  description: "Softwares de simulação realística, debriefing e treinamento em ACLS e ATLS para centros de simulação em saúde.",
  alternates: { canonical: "/softwares" },
};

const SOLUTIONS = [
  {
    icon: Activity,
    t: "Simulação realística",
    d: "Controle de cenários clínicos em tempo real, com monitor de sinais vitais, eventos e respostas fisiológicas para treinar a tomada de decisão.",
  },
  {
    icon: Video,
    t: "Debriefing",
    d: "Gravação e revisão da simulação com vídeo e marcações, para conduzir a discussão com a equipe depois do cenário.",
  },
  {
    icon: HeartPulse,
    t: "ACLS — suporte avançado de vida cardiovascular",
    d: "Cenários de parada cardiorrespiratória e arritmias para treinar os algoritmos de atendimento, do reconhecimento à pós-ressuscitação.",
  },
  {
    icon: ShieldPlus,
    t: "ATLS — suporte avançado de vida no trauma",
    d: "Cenários de atendimento inicial ao politraumatizado, com avaliação primária e intervenções em sequência.",
  },
];

export default function SoftwarePage() {
  return (
    <>
      <PageIntro
        crumb="Softwares"
        eyebrow="Simulação clínica"
        title="Softwares para o seu centro de simulação"
        description="Ajudamos a escolher, instalar e configurar a solução certa para os seus simuladores e objetivos de ensino."
      />
      <section className="container-site py-12 md:py-16">
        <ul className="grid gap-5 md:grid-cols-2">
          {SOLUTIONS.map(({ icon: Icon, t, d }) => (
            <li key={t} className="card flex gap-5 p-6 md:p-8">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-white">
                <Icon className="size-6" aria-hidden />
              </span>
              <span>
                <h2 className="text-xl font-bold">{t}</h2>
                <p className="mt-2 text-[15px] text-muted">{d}</p>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          Também oferecemos instalação, treinamento da equipe e <a href="/manutencao" className="text-brand underline">suporte técnico</a> para softwares de simulação.
        </p>
      </section>
      <section className="container-site grid gap-8 pb-4 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="mb-6 text-2xl font-bold">Solicitar demonstração ou proposta</h2>
          <RequestForm type="SOFTWARE" submitLabel="Enviar solicitação" />
        </div>
        <aside className="lg:pt-14">
          <ContactAside />
        </aside>
      </section>
    </>
  );
}

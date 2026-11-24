import Link from "next/link";
import { getCategoryTree } from "@/lib/catalog/queries";
import { formatDocument } from "@/lib/documents";
import { getSettings, whatsappLink } from "@/lib/settings";
import { Logo } from "@/components/Logo";

export async function Footer() {
  const [tree, s] = await Promise.all([getCategoryTree(), getSettings()]);
  const wa = whatsappLink(s.whatsapp);
  const cols = [
    { title: "Loja", links: tree.map((c) => ({ href: `/categoria/${c.slug}`, label: c.name })) },
    {
      title: "Atendimento",
      links: [
        { href: "/orcamento", label: "Solicitar orçamento" },
        { href: "/manutencao", label: "Manutenção técnica" },
        { href: "/softwares", label: "Softwares de simulação" },
        { href: "/contato", label: "Contato" },
        { href: "/faq", label: "Perguntas frequentes" },
      ],
    },
    {
      title: "Políticas",
      links: [
        { href: "/entrega", label: "Entrega e frete" },
        { href: "/trocas-e-devolucoes", label: "Trocas e devoluções" },
        { href: "/garantia", label: "Garantia" },
        { href: "/privacidade", label: "Privacidade" },
        { href: "/termos", label: "Termos de uso" },
      ],
    },
  ];
  return (
    <footer className="mt-24 bg-ink text-white/75">
      <div className="container-site grid gap-10 py-14 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo inverted />
          <p className="mt-4 text-[15px] leading-relaxed">
            Simuladores, modelos anatômicos, microscópios e softwares de simulação para quem forma profissionais de saúde.
          </p>
          <ul className="mt-5 space-y-1.5 text-[15px]">
            {wa && (
              <li>
                <a href={wa} className="hover:text-white" target="_blank" rel="noopener">
                  WhatsApp: {s.whatsapp}
                </a>
              </li>
            )}
            {s.phone && <li>Telefone: {s.phone}</li>}
            {s.email && (
              <li>
                <a href={`mailto:${s.email}`} className="hover:text-white">
                  {s.email}
                </a>
              </li>
            )}
            {s.instagram && (
              <li>
                <a href={`https://instagram.com/${s.instagram.replace(/^@/, "")}`} className="hover:text-white" target="_blank" rel="noopener">
                  Instagram: @{s.instagram.replace(/^@/, "")}
                </a>
              </li>
            )}
          </ul>
        </div>
        {cols.map((col) => (
          <div key={col.title}>
            <h2 className="mb-4 font-[family-name:var(--font-sans)] text-sm font-semibold uppercase tracking-[0.08em] text-white">{col.title}</h2>
            <ul className="space-y-2 text-[15px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-6 text-[13px] text-white/60 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {s.legalName ?? s.companyName}
            {s.cnpj && <> · CNPJ {formatDocument(s.cnpj)}</>}
            {s.address && <> · {s.address}</>}
          </p>
          <p>Pix · Cartão de crédito · Boleto · Pagamento seguro</p>
        </div>
      </div>
    </footer>
  );
}

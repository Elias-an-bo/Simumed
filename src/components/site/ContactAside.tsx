import { Mail, MessageCircle, Phone } from "lucide-react";
import { getSettings, whatsappLink } from "@/lib/settings";

export async function ContactAside({ title = "Prefere conversar?" }: { title?: string }) {
  const s = await getSettings();
  const wa = whatsappLink(s.whatsapp, "Olá! Vim pelo site da Simumed.");
  if (!wa && !s.email && !s.phone) return null;
  return (
    <div className="card p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      <ul className="mt-4 space-y-3 text-[15px]">
        {wa && (
          <li>
            <a href={wa} target="_blank" rel="noopener" className="flex items-center gap-3 font-medium text-ink hover:text-brand">
              <MessageCircle className="size-5 text-brand" aria-hidden /> WhatsApp {s.whatsapp}
            </a>
          </li>
        )}
        {s.phone && (
          <li className="flex items-center gap-3">
            <Phone className="size-5 text-brand" aria-hidden /> {s.phone}
          </li>
        )}
        {s.email && (
          <li>
            <a href={`mailto:${s.email}`} className="flex items-center gap-3 font-medium text-ink hover:text-brand">
              <Mail className="size-5 text-brand" aria-hidden /> {s.email}
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}

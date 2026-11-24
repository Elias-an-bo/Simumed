import { MessageCircle } from "lucide-react";
import { getSettings, whatsappLink } from "@/lib/settings";

export async function WhatsAppButton() {
  const s = await getSettings();
  const href = whatsappLink(s.whatsapp, "Olá! Vim pelo site da Simumed e gostaria de atendimento.");
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#1f9d55] text-white shadow-[var(--shadow-lift)] transition-transform duration-150 hover:scale-105"
    >
      <MessageCircle className="size-7" aria-hidden />
    </a>
  );
}

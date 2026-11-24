import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Simumed — Simuladores, modelos anatômicos e microscópios",
    template: "%s | Simumed",
  },
  description:
    "Simuladores de enfermagem e medicina, modelos anatômicos, microscópios, softwares de simulação realística e manutenção técnica para instituições de ensino e saúde.",
  openGraph: { type: "website", locale: "pt_BR", siteName: "Simumed" },
};

export const viewport: Viewport = { themeColor: "#0a1a2f" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

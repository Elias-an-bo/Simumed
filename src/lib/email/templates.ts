import { formatBRL } from "@/lib/money";

export function escapeHtml(s: string | null | undefined): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const siteUrl = () => process.env.SITE_URL ?? "http://localhost:3000";

export function layout(title: string, body: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#1c2a3a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:24px 0"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
<tr><td style="background:#0a1a2f;padding:20px 28px;color:#ffffff;font-size:22px;font-weight:bold">simu<span style="color:#5fd3c5">med</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:22px;color:#0a1a2f">${escapeHtml(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:18px 28px;background:#f5f7fa;font-size:12px;color:#5a6b80">Simumed · <a href="${siteUrl()}" style="color:#0b7a72">${siteUrl().replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

export function p(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.6">${text}</p>`;
}

export function button(href: string, label: string): string {
  return `<p style="margin:20px 0"><a href="${href}" style="display:inline-block;background:#0b7a72;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 20px;border-radius:8px">${escapeHtml(label)}</a></p>`;
}

export function table(rows: [string, string][]): string {
  return `<table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:8px 0 16px;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#5a6b80;width:40%">${escapeHtml(k)}</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0">${v}</td></tr>`,
    )
    .join("")}</table>`;
}

export const QUOTE_TYPE_LABEL: Record<string, string> = {
  PRODUCTS: "Orçamento de produtos",
  SOFTWARE: "Softwares de simulação",
  MAINTENANCE: "Manutenção técnica",
  CONTACT: "Contato",
};

export function money(cents: number): string {
  return escapeHtml(formatBRL(cents));
}

export { siteUrl };

import nodemailer from "nodemailer";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Envia e-mail pelo provedor configurado em EMAIL_PROVIDER:
 *  - "console" (padrão em desenvolvimento): mostra no terminal
 *  - "resend": API do Resend (plano gratuito)
 *  - "smtp": qualquer servidor SMTP
 * Nunca lança erro para quem chamou: falha de e-mail não pode derrubar um pedido.
 */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  const from = process.env.EMAIL_FROM ?? "Simumed <contato@simumed.com.br>";
  try {
    if (provider === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text, reply_to: msg.replyTo }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
      return true;
    }
    if (provider === "smtp") {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      await transport.sendMail({ from, to: msg.to, subject: msg.subject, html: msg.html, text: msg.text, replyTo: msg.replyTo });
      return true;
    }
    console.info(`[email:console] para=${msg.to} assunto="${msg.subject}"`);
    return true;
  } catch (e) {
    console.error("[email] falha ao enviar:", e);
    return false;
  }
}

export function storeNotifyAddress(settingsEmail?: string | null): string | null {
  return process.env.STORE_NOTIFY_EMAIL || settingsEmail || null;
}

import { AdminTitle, Notice } from "@/components/admin/ui";
import { prisma } from "@/lib/db";
import { formatDocument } from "@/lib/documents";
import { changePasswordAction, saveSettingsAction } from "../../actions";

const MSG: Record<string, string> = { senha: "Senha atual incorreta.", "senha-curta": "A nova senha precisa ter pelo menos 10 caracteres." };

export default async function SettingsAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; erro?: string }> }) {
  const sp = await searchParams;
  const s = await prisma.settings.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  const f = (name: string, label: string, value: string | number | null, hint?: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`s-${name}`}>{label}</label>
      <input id={`s-${name}`} name={name} defaultValue={value ?? ""} className="field" {...props} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
  return (
    <>
      <AdminTitle title="Configurações" />
      {sp.ok === "1" && <Notice>Configurações salvas.</Notice>}
      {sp.ok === "senha" && <Notice>Senha alterada.</Notice>}
      {sp.erro && <Notice kind="error">{MSG[sp.erro] ?? "Erro."}</Notice>}
      <form action={saveSettingsAction} className="grid gap-6 xl:grid-cols-2">
        <section className="card grid gap-4 p-5">
          <h2 className="text-lg font-bold">Empresa (aparece no rodapé e nas políticas)</h2>
          {f("companyName", "Nome fantasia", s.companyName)}
          {f("legalName", "Razão social", s.legalName, "Obrigatório para lojas online (Decreto 7.962/2013)")}
          {f("cnpj", "CNPJ", s.cnpj ? formatDocument(s.cnpj) : "")}
          {f("address", "Endereço comercial", s.address, "Rua, número, cidade/UF — pode ser endereço comercial ou caixa postal")}
          {f("whatsapp", "WhatsApp", s.whatsapp, "Com DDD. Ativa o botão de WhatsApp no site")}
          {f("phone", "Telefone", s.phone)}
          {f("email", "E-mail de atendimento", s.email, "Também recebe os avisos de vendas e orçamentos")}
          {f("instagram", "Instagram", s.instagram, "Só o usuário, sem @")}
        </section>
        <section className="card grid content-start gap-4 p-5">
          <h2 className="text-lg font-bold">Vendas e frete</h2>
          {f("originCep", "CEP de onde os produtos saem", s.originCep, "Usado no cálculo do frete pelo Melhor Envio", { inputMode: "numeric" })}
          {f("handlingDays", "Dias para preparar o envio", s.handlingDays, "Somado ao prazo da transportadora", { inputMode: "numeric" })}
          {f("defaultMarkupPercent", "Margem padrão sobre o custo (%)", s.defaultMarkupPercent, "Mudar aqui recalcula os preços que não têm margem própria", { inputMode: "decimal" })}
          {f("pixDiscountPercent", "Desconto no Pix (%)", s.pixDiscountPercent, undefined, { inputMode: "decimal" })}
          {f("maxInstallments", "Parcelas máximas no cartão", s.maxInstallments, "Confira as condições de parcelamento na sua conta do Mercado Pago", { inputMode: "numeric" })}
          {f("quoteThreshold", "Acima deste preço, só orçamento (R$)", (s.quoteThresholdCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 }), undefined, { inputMode: "decimal" })}
          <button type="submit" className="btn btn-primary mt-2">Salvar configurações</button>
        </section>
      </form>
      <form action={changePasswordAction} className="card mt-6 grid max-w-xl gap-4 p-5">
        <h2 className="text-lg font-bold">Trocar senha do painel</h2>
        <div>
          <label className="label" htmlFor="pw-c">Senha atual</label>
          <input id="pw-c" name="current" type="password" autoComplete="current-password" className="field" required />
        </div>
        <div>
          <label className="label" htmlFor="pw-n">Nova senha (mínimo 10 caracteres)</label>
          <input id="pw-n" name="next" type="password" autoComplete="new-password" minLength={10} className="field" required />
        </div>
        <button type="submit" className="btn btn-secondary justify-self-start">Trocar senha</button>
      </form>
    </>
  );
}

"use client";

import { startTransition, useActionState, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { formatBRL, parseBRLToCents } from "@/lib/money";
import { priceFromCost, pixPrice } from "@/lib/pricing";

type Cat = { id: string; label: string; markup: number | null; parentMarkup: number | null };
type Values = {
  name: string; shortDescription: string; description: string; categoryId: string; cost: string; markupPercent: string;
  availability: string; leadTimeDays: string; weightKg: string; lengthCm: string; widthCm: string; heightCm: string; warrantyDays: string;
  active: boolean; featured: boolean; quoteOnly: boolean; freightOnRequest: boolean;
};

export function ProductForm({
  action, categories, values, storeMarkup, pixDiscountPercent, quoteThresholdCents, isNew,
}: {
  action: (prev: { error?: string; savedAt?: string }, fd: FormData) => Promise<{ error?: string; savedAt?: string }>;
  categories: Cat[]; values: Values; storeMarkup: number; pixDiscountPercent: number; quoteThresholdCents: number; isNew: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [cost, setCost] = useState(values.cost);
  const [markup, setMarkup] = useState(values.markupPercent);
  const [categoryId, setCategoryId] = useState(values.categoryId);
  const cat = categories.find((c) => c.id === categoryId);
  const inherited = cat?.markup ?? cat?.parentMarkup ?? storeMarkup;
  const effective = markup.trim() === "" ? inherited : Number(markup.replace(",", "."));
  const price = useMemo(() => priceFromCost(parseBRLToCents(cost || "0"), Number.isFinite(effective) ? effective : inherited), [cost, effective, inherited]);

  const num = (name: keyof Values, label: string, hint?: string) => (
    <div>
      <label className="label" htmlFor={`p-${name}`}>{label}</label>
      <input id={`p-${name}`} name={name} defaultValue={String(values[name])} inputMode="decimal" className="field" />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
  const check = (name: keyof Values, label: string, hint: string) => (
    <label className="flex items-start gap-3 rounded-[var(--radius-control)] border border-line p-3">
      <input type="checkbox" name={name} defaultChecked={Boolean(values[name])} className="mt-1" />
      <span><span className="block text-sm font-semibold text-ink">{label}</span><span className="block text-xs text-muted">{hint}</span></span>
    </label>
  );

  return (
    <form
      className="grid gap-6 xl:grid-cols-[1fr_340px]"
      onSubmit={(e) => {
        // envia sem o "reset" automático do React 19, que voltava a categoria para a 1ª opção
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      <div className="space-y-6">
        {state.error && <p role="alert" className="rounded-[var(--radius-control)] bg-[#fdecec] p-3 text-sm text-danger">{state.error}</p>}
        {state.savedAt && !pending && <p role="status" className="rounded-[var(--radius-control)] bg-success-soft p-3 text-sm text-success">Salvo às {state.savedAt}. A loja já foi atualizada.</p>}
        <section className="card grid gap-4 p-5">
          <div>
            <label className="label" htmlFor="p-name">Nome</label>
            <input id="p-name" name="name" defaultValue={values.name} required className="field" />
          </div>
          <div>
            <label className="label" htmlFor="p-cat">Categoria</label>
            <select id="p-cat" name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field">
              {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="p-short">Resumo (aparece no Google)</label>
            <input id="p-short" name="shortDescription" defaultValue={values.shortDescription} maxLength={300} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="p-desc">Descrição</label>
            <textarea id="p-desc" name="description" defaultValue={values.description} rows={10} className="field" placeholder="Separe os parágrafos com uma linha em branco." />
          </div>
        </section>
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-bold sm:col-span-2">Entrega e disponibilidade</h2>
          <div>
            <label className="label" htmlFor="p-av">Disponibilidade</label>
            <select id="p-av" name="availability" defaultValue={values.availability} className="field">
              <option value="IN_STOCK">Pronta entrega</option>
              <option value="ON_ORDER">Sob encomenda</option>
              <option value="ON_REQUEST">Sob consulta</option>
            </select>
          </div>
          {num("leadTimeDays", "Prazo sob encomenda (dias)", "Deixe vazio se for pronta entrega")}
          {num("weightKg", "Peso com embalagem (kg)")}
          {num("warrantyDays", "Garantia (dias)")}
          {num("lengthCm", "Comprimento da caixa (cm)")}
          {num("widthCm", "Largura da caixa (cm)")}
          {num("heightCm", "Altura da caixa (cm)")}
        </section>
        <section className="card p-5">
          <h2 className="text-lg font-bold">Fotos</h2>
          <input type="file" name="images" accept="image/jpeg,image/png,image/webp" multiple className="mt-3 block text-sm" />
          <p className="mt-1 text-xs text-muted">JPG, PNG ou WebP — até 5 MB no total por envio. As fotos são otimizadas automaticamente.</p>
        </section>
      </div>
      <aside className="space-y-6">
        <section className="card grid gap-4 p-5">
          <h2 className="text-lg font-bold">Preço</h2>
          <div>
            <label className="label" htmlFor="p-cost">Custo (R$)</label>
            <input id="p-cost" name="cost" value={cost} onChange={(e) => setCost(e.target.value)} inputMode="decimal" className="field num" />
          </div>
          <div>
            <label className="label" htmlFor="p-mk">Margem sobre o custo (%)</label>
            <input id="p-mk" name="markupPercent" value={markup} onChange={(e) => setMarkup(e.target.value)} inputMode="decimal" placeholder={`${inherited} (da categoria)`} className="field num" />
            <p className="mt-1 text-xs text-muted">Vazio = usa a margem da categoria ({inherited}%).</p>
          </div>
          <div className="num rounded-[var(--radius-control)] bg-surface p-3 text-sm">
            <p>Preço de venda: <strong className="text-lg text-ink">{price ? formatBRL(price) : "—"}</strong></p>
            {price > 0 && <p className="text-muted">No Pix: {formatBRL(pixPrice(price, pixDiscountPercent))}</p>}
            {price >= quoteThresholdCents && <p className="mt-1 text-warn">Acima do limite: aparece como “sob orçamento”.</p>}
            {price === 0 && <p className="mt-1 text-warn">Sem custo: aparece como “sob orçamento”.</p>}
          </div>
        </section>
        <section className="grid gap-2">
          {check("active", "Ativo na loja", "Desmarque para esconder o produto")}
          {check("featured", "Destaque na página inicial", "Aparece em “Mais procurados”")}
          {check("quoteOnly", "Vender só por orçamento", "Mostra “Solicitar orçamento” no lugar de comprar")}
          {check("freightOnRequest", "Frete sob consulta", "Para itens grandes ou pesados")}
        </section>
        <button type="submit" className="btn btn-primary h-12 w-full" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />} {isNew ? "Criar produto" : "Salvar alterações"}
        </button>
      </aside>
    </form>
  );
}

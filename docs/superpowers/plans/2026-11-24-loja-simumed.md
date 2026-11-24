# Loja Simumed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Loja online própria da Simumed (vitrine + carrinho + frete + Pix/cartão/boleto + orçamento + manutenção + painel) rodando sem custo fixo em simumed.com.br.

**Architecture:** Um único app Next.js (App Router). Vitrine estática com revalidação sob demanda; carrinho no navegador; servidor só para frete, checkout, webhooks, formulários e painel. Postgres via Prisma. Pagamento e frete atrás de interfaces com implementação real (Mercado Pago, Melhor Envio) e `fake` (dev/testes, este ambiente não alcança as APIs reais).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Prisma 7 + `@prisma/adapter-pg`, PostgreSQL 16, zod 4, jose, bcryptjs, nodemailer, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-24-loja-simumed-design.md`

## Global Constraints

- Repositório é **público**: nada de custo, nome/código do fornecedor ou dados pessoais do dono no git. `data/private/` é ignorado.
- Valores monetários sempre em centavos (`number` inteiro); exibição `R$ 1.234,90` (pt-BR).
- Preço = custo × (1 + markup/100), arredondado para cima até terminar em ,90. Markup padrão 40.
- Desconto Pix padrão 5%; parcelas padrão 10; limite de orçamento padrão R$ 10.000,00 (1_000_000 centavos).
- Frete sob consulta automático na importação: peso > 30 kg ou maior lado > 100 cm.
- SKU público `SM-0001`… na ordem da cotação.
- Todo texto visível em português do Brasil.
- Custo fixo zero: nada que exija plano pago.

## Review Focus

1. Carrinho com produto cujo preço mudou, ficou inativo ou virou "orçamento" depois de adicionado → checkout reprecifica no servidor e bloqueia itens não vendáveis com mensagem clara.
2. Webhook repetido, fora de ordem ou de pagamento desconhecido → atualização idempotente; pedido PAGO nunca volta para PENDENTE.
3. CEP inválido ou Melhor Envio sem serviço/erro → "frete sob consulta" e caminho de orçamento; nunca cobrar com frete 0.
4. CPF/CNPJ com máscara, espaços ou dígito errado → normalizado e validado.
5. Produto sem custo (arquivo privado ausente) → nunca vendido a R$ 0; vira "Solicitar orçamento".

---

### Task 1: Base do projeto e utilitários de domínio

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`, `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/lib/money.ts`, `src/lib/text.ts`, `src/lib/documents.ts`, `src/lib/pricing.ts`, `src/lib/cep.ts`
- Test: `tests/unit/money.test.ts`, `tests/unit/text.test.ts`, `tests/unit/documents.test.ts`, `tests/unit/pricing.test.ts`

**Interfaces:**
- Produces:
  - `formatBRL(cents: number): string` → `"R$ 1.234,90"`
  - `slugify(s: string): string`; `normalizeProductName(raw: string): string`
  - `onlyDigits(s: string): string`; `isValidCPF(s: string): boolean`; `isValidCNPJ(s: string): boolean`; `formatDocument(s: string): string`
  - `priceFromCost(costCents: number, markupPercent: number): number`; `pixPrice(cents: number, discountPercent: number): number`; `installmentValue(cents: number, n: number): number`
  - `normalizeCep(s: string): string | null` (8 dígitos ou null)

- [ ] Testes: `formatBRL(123490)` → `"R$ 1.234,90"` (espaço comum); `priceFromCost(114378, 40)` → `160190`; `priceFromCost(100000, 40)` → `140090`; `priceFromCost(0, 40)` → `0`; `pixPrice(160190, 5)` → `152181` (arredonda para baixo); `normalizeProductName("MANEQUIM BISSEXUAL ADULTO C/ ÓRGÃOS INTERNOS P/ TREINO DE ENFERMAGEM DE 1,70CM")` → `"Manequim bissexual adulto com órgãos internos para treino de enfermagem de 1,70 cm"`; siglas preservadas (`RCP`, `BLS`, `DEA`, `IV`, `IM`, `SC`); `isValidCPF("529.982.247-25")` true, `"111.111.111-11"` false; `isValidCNPJ("11.222.333/0001-81")` true; `normalizeCep("06720-050")` → `"06720050"`, `"123"` → null.
- [ ] Rodar `npx vitest run` → falha; implementar; rodar → passa.
- [ ] Commit `feat: base do projeto e utilitários`.

### Task 2: Banco e importação do catálogo

**Files:**
- Create: `prisma/schema.prisma`, `prisma.config.ts`, `src/lib/db.ts`, `src/lib/catalog/parse-cotacao.ts`, `src/lib/catalog/category-map.ts`, `scripts/import-cotacao.ts`, `prisma/seed.ts`, `data/catalogo.json` (público), `data/private/custos.json` (ignorado)
- Test: `tests/unit/parse-cotacao.test.ts` (fixture `tests/fixtures/cotacao-trecho.txt` com valores fictícios)

**Interfaces:**
- Produces:
  - Modelos Prisma: `Category`, `Product`, `ProductImage`, `Settings` (id fixo `"default"`), `Order`, `OrderItem`, `OrderEvent`, `QuoteRequest`, `QuoteItem`, `AdminUser`; enums `Availability {IN_STOCK, ON_ORDER, ON_REQUEST}`, `OrderStatus {PENDING_PAYMENT, PAID, PREPARING, SHIPPED, DELIVERED, CANCELED}`, `PaymentMethod {PIX, CARD, BOLETO}`, `QuoteType {PRODUCTS, SOFTWARE, MAINTENANCE, CONTACT}`, `QuoteStatus {NEW, IN_PROGRESS, ANSWERED, WON, LOST}`
  - `parseCotacao(text: string): ParsedItem[]` com `{ supplierCode, rawName, costCents, availability, leadTimeDays, categoryPath: [string, string], lengthCm, widthCm, heightCm, weightKg, warrantyDays, ncm }`
  - `categoryFor(path: [string,string]): { parent: {slug,name}, child: {slug,name} }`
  - `prisma` (singleton) em `src/lib/db.ts`

- [ ] Teste do parser: fixture com 3 itens (um com nome em 2 linhas e URL quebrada, um "Previsão em 120 dias") → 3 itens, custos em centavos (`272875` de `R$ 2.728,7528`), `availability` `ON_ORDER` e `leadTimeDays` 120 no segundo, `categoryPath` `["simuladores","cuidados-com-paciente"]`.
- [ ] Implementar parser, mapa de categorias, script `npm run catalog:import -- <arquivo.txt>` que grava `data/catalogo.json` (sem custo/código do fornecedor) e `data/private/custos.json` (`{ sku: { supplierCode, costCents } }`).
- [ ] Seed: cria categorias, produtos (SKU, slug único, preço calculado; sem custo → `quoteOnly`), `Settings` padrão e admin a partir de `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Idempotente (upsert por SKU).
- [ ] Rodar migração + seed em Postgres local; conferir 303 produtos.
- [ ] Commit `feat: banco de dados e importação do catálogo`.

### Task 3: Vitrine

**Files:**
- Create: `src/lib/catalog/queries.ts`, `src/lib/settings.ts`, `src/app/(site)/layout.tsx`, `src/app/(site)/page.tsx`, `src/app/(site)/produtos/page.tsx`, `src/app/(site)/produtos/[slug]/page.tsx`, `src/app/(site)/categoria/[slug]/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/components/*` (Header, Footer, ProductCard, ProductImage/placeholder, Price, Breadcrumbs, WhatsAppButton, Logo)
- Test: `tests/unit/sellable.test.ts`

**Interfaces:**
- Produces: `getSettings(): Promise<Settings>`; `listProducts(opts: {q?, categorySlug?, availability?, sort?, page?}): Promise<{items, total}>`; `getProductBySlug(slug)`; `getCategoryTree()`; `sellability(product, settings): { mode: "buy" | "quote", reason?: "price-threshold" | "manual" | "no-price" | "freight" }`

- [ ] Testes de `sellability`: preço 0 → quote/no-price; preço ≥ limite → quote/price-threshold; `quoteOnly` → quote/manual; normal → buy. `freightOnRequest` continua "buy" no produto mas bloqueia no checkout (Task 5).
- [ ] Implementar páginas com revalidação (`revalidate = 3600`), JSON-LD de Produto, metadados, busca/filtros/ordenação por query string.
- [ ] Conferir no navegador (Playwright screenshot) home, lista, produto, categoria em desktop e celular.
- [ ] Commit `feat: vitrine`.

### Task 4: Orçamento, manutenção, softwares e páginas institucionais

**Files:**
- Create: `src/lib/quotes/schema.ts`, `src/lib/quotes/create-quote.ts`, `src/lib/email/send.ts`, `src/lib/email/templates.ts`, `src/lib/security/rate-limit.ts`, `src/app/(site)/orcamento/*`, `manutencao`, `softwares`, `sobre`, `contato`, `faq`, `entrega`, `trocas-e-devolucoes`, `garantia`, `privacidade`, `termos`
- Test: `tests/unit/quote-schema.test.ts`, `tests/unit/rate-limit.test.ts`

**Interfaces:**
- Produces: `quoteInputSchema` (zod; `type`, `name`, `email`, `phone`, `institution?`, `document?`, `city?`, `state?`, `message?`, `items?: {productId, quantity}[]`, `equipment?`, `brandModel?`, `website` honeypot vazio); `createQuote(input): Promise<{number}>`; `sendEmail({to, subject, html})`; `rateLimit(key, limit, windowMs): boolean`
- [ ] Testes: honeypot preenchido rejeita; e-mail inválido rejeita; documento opcional mas se vier deve ser CPF/CNPJ válido; rate-limit bloqueia 6ª chamada em 1 min com limite 5.
- [ ] Implementar server actions dos formulários; página de sucesso com número do orçamento; e-mail ao cliente e ao dono.
- [ ] Commit `feat: orçamento, manutenção, softwares e páginas institucionais`.

### Task 5: Carrinho e frete

**Files:**
- Create: `src/lib/cart/store.ts` (cliente), `src/lib/cart/price-cart.ts` (servidor), `src/lib/shipping/types.ts`, `fake.ts`, `melhor-envio.ts`, `index.ts`, `src/app/api/frete/route.ts`, `src/app/(site)/carrinho/page.tsx`, `src/components/ShippingCalculator.tsx`, `src/components/AddToCartButton.tsx`
- Test: `tests/unit/price-cart.test.ts`, `tests/unit/melhor-envio.test.ts`

**Interfaces:**
- Produces:
  - `priceCart(lines: {productId: string, quantity: number}[]): Promise<{ lines: PricedLine[], subtotalCents, blocked: BlockedLine[], freightOnRequest: boolean }>`
  - `ShippingProvider.quote({ toCep, items: {id, weightKg, lengthCm, widthCm, heightCm, insuranceCents, quantity}[] }): Promise<ShippingOption[]>` com `ShippingOption { id: string, name: string, company: string, priceCents: number, days: number }`
  - `getShippingProvider()` escolhe por `SHIPPING_PROVIDER=melhorenvio|fake`
- [ ] Testes: linha de produto inativo/orçamento vai para `blocked`; quantidade ≤ 0 ou > 99 é normalizada; `freightOnRequest` true se algum item tem a flag; parser do Melhor Envio ignora serviços com `error` e soma dias de preparo das configurações.
- [ ] Implementar; `/api/frete` valida CEP, aplica rate-limit, retorna opções ou `{ onRequest: true }`.
- [ ] Commit `feat: carrinho e cálculo de frete`.

### Task 6: Checkout, pagamento e pedidos

**Files:**
- Create: `src/lib/payments/types.ts`, `fake.ts`, `mercado-pago.ts`, `index.ts`, `src/lib/orders/create-order.ts`, `src/lib/orders/apply-payment.ts`, `src/app/(site)/checkout/*`, `src/app/(site)/pedido/[id]/page.tsx`, `src/app/api/checkout/route.ts`, `src/app/api/webhooks/mercadopago/route.ts`, `src/app/api/pedidos/[id]/status/route.ts`
- Test: `tests/unit/apply-payment.test.ts`, `tests/unit/mp-signature.test.ts`, `tests/integration/checkout.test.ts`

**Interfaces:**
- Produces:
  - `PaymentProvider.createPayment(order, input: {method, cardToken?, installments?, payer}) → { providerId, status: "approved"|"pending"|"rejected", pix?: {qrCode, qrCodeBase64, expiresAt}, boletoUrl? }`; `getPayment(id)`; `verifyWebhook(headers, body): boolean`
  - `createOrder(input): Promise<Order>` (reprecifica, recota frete pelo id da opção escolhida, aplica desconto Pix, gera `number` sequencial e `accessToken`)
  - `nextStatusFor(current: OrderStatus, payment: "approved"|"pending"|"rejected"|"refunded"|"cancelled"): OrderStatus` (nunca rebaixa PAID+)
- [ ] Testes: `nextStatusFor(PAID, "pending")` → PAID; `(PENDING_PAYMENT,"approved")` → PAID; `(PENDING_PAYMENT,"rejected")` → PENDING_PAYMENT; assinatura MP válida/ inválida com segredo de teste; integração com Postgres + providers fake: checkout cria pedido com total = subtotal − desconto Pix + frete, webhook aprovado duas vezes gera 1 evento de pagamento.
- [ ] Implementar formulário (dados pessoais CPF/CNPJ, endereço com busca de CEP via ViaCEP no navegador, frete, pagamento), página do pedido com QR do Pix e polling de status, e-mails.
- [ ] Commit `feat: checkout, pagamento e pedidos`.

### Task 7: Painel administrativo

**Files:**
- Create: `src/lib/auth/session.ts`, `src/lib/auth/password.ts`, `src/proxy.ts`, `src/lib/storage/*`, `src/app/admin/login/page.tsx`, `src/app/admin/(painel)/{layout,page}.tsx`, `pedidos`, `orcamentos`, `produtos`, `categorias`, `configuracoes`
- Test: `tests/unit/session.test.ts`

**Interfaces:**
- Consumes: modelos da Task 2, `priceFromCost`, `revalidatePath`.
- Produces: `createSession(adminId)`, `getSession()`, `requireAdmin()`.
- [ ] Testes: token adulterado é rejeitado; token expirado é rejeitado.
- [ ] Implementar telas: resumo (pedidos pagos do mês, orçamentos novos), pedidos (filtro por status, mudar status, código de rastreio → e-mail), orçamentos/manutenção (status, observações), produtos (busca, editar nome/descrição/custo/markup/flags/fotos, preço recalculado na hora), categorias (markup), configurações. Salvar revalida páginas afetadas.
- [ ] Commit `feat: painel administrativo`.

### Task 8: Publicação e verificação ponta a ponta

**Files:**
- Create: `netlify.toml`, `Dockerfile`, `docs/PUBLICACAO.md` (passo a passo em português: Neon, Netlify, Resend, Mercado Pago, Melhor Envio, DNS no registro.br, desligar Nuvemshop), `playwright.config.ts`, `tests/e2e/compra.spec.ts`, `tests/e2e/admin.spec.ts`, `README.md`
- [ ] E2E: navegar → produto → adicionar → carrinho → CEP → checkout Pix (fake) → página do pedido mostra QR; admin faz login, altera markup de um produto e o preço público muda.
- [ ] `npm run build`, `npx vitest run`, `npx playwright test` passam.
- [ ] Commit `chore: publicação e testes ponta a ponta`; push.

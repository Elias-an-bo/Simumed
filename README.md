# Loja Simumed

Loja online da Simumed: simuladores, modelos anatômicos, microscópios, softwares de simulação e manutenção.
Next.js 16 + PostgreSQL (Prisma 7), pagamento pelo Mercado Pago (Pix, cartão, boleto), frete pelo Melhor Envio,
painel administrativo próprio. Roda sem custo mensal (Netlify + Neon + Resend).

- **Publicar:** [docs/PUBLICACAO.md](docs/PUBLICACAO.md)
- **Visual:** [DESIGN.md](DESIGN.md)
- **Desenho e plano:** [docs/superpowers](docs/superpowers)

## Desenvolvimento

```bash
cp .env.example .env              # PAYMENT_PROVIDER/SHIPPING_PROVIDER "fake" para testar sem contas
npm install
npx prisma migrate dev
npm run db:seed                   # catálogo (data/catalogo.json) + fotos + usuário do painel
npm run dev                       # http://localhost:3000 · painel em /admin
```

Testes: `npm test` (unidade) · `npm run test:integration` (Postgres `simumed_test`) · `npm run test:e2e` (navegador).

## Catálogo e dados privados

O repositório é público. **Custos e códigos do fornecedor nunca entram no git**: ficam em `data/private/`
(ignorado) e no banco.

- `npm run catalog:import -- cotacao.pdf` lê a cotação (precisa do `pdftotext`) e gera `data/catalogo.json`
  (público) e `data/private/custos.json` (privado).
- `npm run catalog:fotos` baixa as fotos dos produtos do site do fornecedor para `public/fotos/` (respeita o
  robots.txt dele e confere o código do produto quando o link da cotação está desatualizado).
- Em produção, os custos entram pelo painel: **Produtos → Importar custos** (`custos.json`).

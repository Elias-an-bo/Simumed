# Como colocar a loja no ar (sem custo mensal)

Este guia leva a loja para **simumed.com.br** usando só planos gratuitos. Siga na ordem. Nenhuma senha ou chave
deve ser enviada por chat ou e-mail: elas vão direto nos painéis de cada serviço.

**O que é grátis e o que é cobrado**

| Serviço | Para quê | Custo |
|---|---|---|
| Netlify (plano Free) | hospeda o site | grátis (300 créditos/mês; uso comercial permitido) |
| Neon (plano Free) | banco de dados | grátis (1 GB) |
| Resend (plano Free) | envio de e-mails | grátis (3.000 e-mails/mês) |
| Mercado Pago | Pix, cartão e boleto | só taxa por venda aprovada |
| Melhor Envio | frete | o cliente paga o frete; você paga a etiqueta com o valor recebido |
| registro.br | domínio | renovação anual (já pago) |

---

## 1. Banco de dados — Neon

1. Crie uma conta em **neon.tech** (pode entrar com o GitHub).
2. Crie um projeto chamado `simumed`, região **AWS São Paulo (sa-east-1)**.
3. Em **Connection details**, copie a *connection string* (começa com `postgresql://`). Guarde para o passo 3.

## 2. Mercado Pago

1. Entre em **mercadopago.com.br/developers** com a conta da loja → **Suas integrações** → **Criar aplicação**
   (tipo: pagamentos online, “Checkout Transparente”).
2. Em **Credenciais de produção**, copie a **Public Key** e o **Access Token**.
3. Em **Webhooks** (Notificações), configure:
   - URL: `https://simumed.com.br/api/webhooks/mercadopago`
   - Evento: **Pagamentos**
   - Salve e copie a **assinatura secreta**.
4. Confira em **Seu negócio → Custos** as taxas e o parcelamento sem juros que você quer oferecer.
5. **Cadastre uma chave Pix na conta do Mercado Pago** (Seu perfil → Chaves Pix). Sem ela o Pix não é gerado.

## 3. Melhor Envio

1. Entre em **melhorenvio.com.br** → **Integrações → Permissões de acesso** → **Gerar novo token**.
2. Marque as permissões de cálculo de frete (`shipping-calculate`) e copie o token.

## 4. E-mail — Resend

1. Crie uma conta em **resend.com** → **Domains → Add domain** → `simumed.com.br`.
2. O Resend mostra alguns registros DNS (TXT/MX). Adicione-os no registro.br (passo 6) e clique em **Verify**.
3. Em **API Keys**, crie uma chave e copie.

## 5. Site — Netlify

1. Crie uma conta em **netlify.com** com o GitHub.
2. **Add new site → Import an existing project → GitHub** → escolha o repositório `Simumed`, branch principal.
   As configurações de build já vêm do arquivo `netlify.toml`.
3. Antes de publicar, em **Site configuration → Environment variables**, crie as variáveis abaixo:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | connection string do Neon |
| `SITE_URL` | `https://simumed.com.br` |
| `SESSION_SECRET` | um texto aleatório com 40+ caracteres (ex.: gere em 1password.com/password-generator) |
| `ADMIN_EMAIL` | seu e-mail de acesso ao painel |
| `ADMIN_PASSWORD` | uma senha forte (troque depois pelo painel) |
| `PAYMENT_PROVIDER` | `mercadopago` |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token de produção |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | Public Key de produção |
| `MERCADOPAGO_WEBHOOK_SECRET` | assinatura secreta do webhook |
| `SHIPPING_PROVIDER` | `melhorenvio` |
| `MELHORENVIO_TOKEN` | token do Melhor Envio |
| `MELHORENVIO_ENV` | `production` |
| `MELHORENVIO_USER_AGENT` | `Simumed (seu-email@dominio)` — o Melhor Envio exige um e-mail de contato |
| `EMAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` | chave do Resend |
| `EMAIL_FROM` | `Simumed <contato@simumed.com.br>` |
| `STORE_NOTIFY_EMAIL` | e-mail que recebe avisos de vendas e orçamentos |
| `STORAGE_PROVIDER` | `netlify` |

4. Clique em **Deploy**. Na primeira publicação o catálogo (303 produtos e 240 com foto) é carregado no banco.
5. Abra o endereço provisório (`algo.netlify.app`) e confira se a loja abriu.

## 6. Domínio — apontar simumed.com.br para a Netlify

> Faça isto só depois de conferir a loja no endereço provisório. Enquanto isso, a Nuvemshop continua no ar.

1. Na Netlify: **Domain management → Add a domain** → `simumed.com.br` (e aceite adicionar `www.simumed.com.br`).
   A Netlify mostra os registros DNS que precisa.
2. No **registro.br** → domínio `simumed.com.br` → **DNS → Editar zona** (modo avançado):
   - **Apague** os registros que apontam para a Nuvemshop (normalmente um `A`/`CNAME` para `@` e `www`).
   - Crie um registro **A** para `@` com o IP indicado pela Netlify (hoje `75.2.60.5`).
   - Crie um **CNAME** para `www` apontando para `seu-site.netlify.app`.
   - Adicione também os registros do Resend (passo 4).
3. A troca leva de minutos a algumas horas. A Netlify ativa o HTTPS (cadeado) sozinha.
4. Só depois que `https://simumed.com.br` abrir a loja nova, cancele o plano da Nuvemshop.

## 7. Primeiro acesso ao painel

1. Entre em `https://simumed.com.br/admin` com `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
2. **Configurações**: preencha razão social, CNPJ, endereço comercial, WhatsApp, e-mail, Instagram e o
   **CEP de onde os produtos saem** (sem ele o frete fica “sob consulta”). Troque a senha.
3. **Produtos → Importar custos**: envie o arquivo `custos.json` (fica fora do GitHub). Os preços são
   calculados com a margem padrão de 40% sobre o custo; ajuste em **Categorias e margens**.
4. Revise os produtos marcados como **sem foto** e **medidas estimadas**.
5. Faça uma compra de teste de valor baixo com Pix e confira: e-mail recebido, pedido “Pagamento aprovado” no painel.

## Rotina

- **Venda paga** → você recebe e-mail → no painel, abra o pedido, gere a etiqueta no Melhor Envio com o endereço
  mostrado, e marque como **Enviado** com o código de rastreio (o cliente recebe por e-mail).
- **Orçamento/manutenção** → chega por e-mail e fica em **Orçamentos** no painel.
- **Nova cotação do fornecedor** → envie o PDF para quem mantém o site gerar um novo `custos.json`
  (`npm run catalog:import -- cotacao.pdf`), depois importe pelo painel.

## Limites do plano gratuito da Netlify

O site foi feito para gastar pouco: páginas de produto ficam em cache e só o carrinho, o frete, o checkout e o
painel usam o servidor. Se um dia os 300 créditos do mês acabarem, o site pausa até o mês seguinte — sinal de que
as vendas cresceram e vale o plano pago (a partir de US$ 9/mês). Acompanhe em **Netlify → Usage**.

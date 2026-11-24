# Loja Simumed — desenho do projeto

Data: 2026-11-24 · Status: aprovado pelo dono ("ok usa a opção 1", "só me pede o que precisa ser feito")

## Por que existe

A Simumed hoje vende numa loja da Nuvemshop e quer um site próprio, profissional, no domínio
**simumed.com.br**, sem depender da plataforma. O dono não tem verba: o domínio já está pago e o
sistema precisa rodar **sem custo fixo mensal**.

A Simumed é distribuidora (de um fornecedor principal nacional) de:

- simuladores de enfermagem/medicina (RCP, intubação, injeção, parto, cuidados com paciente…)
- modelos anatômicos (esqueletos, órgãos, torsos, patológicos, dentes…)
- microscópios, acessórios e lâminas preparadas
- kits moleculares e anatomia veterinária
- softwares de simulação realística (realismo, debriefing, ACLS, ATLS)
- **serviço de manutenção** de simuladores, modelos, microscópios e softwares

Clientes: faculdades, escolas técnicas, hospitais, centros de simulação e também profissionais
e estudantes. Instituições compram com CNPJ, orçamento formal e às vezes boleto/faturamento.

## Objetivos

1. Vitrine profissional, rápida e confiável, com a cara de uma empresa séria de simulação em saúde.
2. Compra online completa: carrinho, frete calculado (Melhor Envio), pagamento por Pix, cartão
   e boleto (Mercado Pago, transparente, sem sair do site).
3. Caminho de **orçamento** para instituições e itens caros: "Solicitar orçamento" no produto e
   "Transformar carrinho em orçamento".
4. Páginas de **manutenção** e **softwares** com formulário de pedido/demonstração.
5. Painel administrativo simples para o dono: produtos, preços/margens, pedidos, orçamentos,
   pedidos de manutenção e configurações da loja.
6. Catálogo inicial importado da cotação do fornecedor (303 produtos, com peso e medidas). Custos ficam fora do git (arquivo privado, ignorado).
7. Custo fixo zero.

## Fora do escopo (agora)

- Emissão de nota fiscal (o dono continua emitindo como hoje; integração futura).
- Conta/login de cliente (checkout como visitante; o cliente acompanha o pedido por link).
- Cupons, programa de fidelidade, marketplaces.
- Compra automática de etiqueta no Melhor Envio (fase 2: o dono gera a etiqueta no painel do
  Melhor Envio com os dados do pedido).
- Migração do histórico de pedidos da Nuvemshop.

## Anti-objetivos (seria fracasso mesmo funcionando)

- Parecer modelo pronto ou loja amadora.
- **Expor o fornecedor**: nome, códigos do fornecedor e preço de custo nunca aparecem no site nem no repositório (que é público).
- Expor dados pessoais do dono (CPF, endereço residencial) que estão na cotação.
- Deixar o cliente pagar um pedido cujo frete não foi calculado.
- Perder pedido pago (webhook falhou e ninguém soube).
- Criar custo mensal escondido.

## Restrições

- Domínio simumed.com.br (registro.br). DNS editado no próprio registro.br (gratuito).
- Custo fixo zero: só serviços com plano gratuito que permite uso comercial.
  - Vercel Hobby **não** serve (proíbe uso comercial).
  - Netlify Free permite uso comercial, mas tem 300 créditos/mês; se acabarem, o site pausa até
    o mês seguinte. Por isso a vitrine é estática/cache e o servidor só trabalha em checkout,
    frete, formulários e painel.
- Neon Free: 1 GB de banco e 100 CU-horas por mês, suspende sozinho quando ocioso.
- Este ambiente de desenvolvimento não alcança as APIs do Mercado Pago e do Melhor Envio:
  tudo é construído com provedores "fake" para teste, e os reais são verificados com as chaves do
  dono na fase de publicação.

## Caminhos considerados

1. **Sistema próprio sob medida (escolhido).** Next.js + Postgres, painel próprio, integrações
   diretas com Mercado Pago e Melhor Envio. Visual 100% próprio, fluxo carrinho + orçamento sob
   medida, roda grátis em Netlify + Neon. Contra: mudanças fora do painel exigem programador.
2. WooCommerce com tema próprio. Plugins prontos, mas precisa de hospedagem PHP paga e manutenção
   constante de plugins; visual mais "loja padrão".
3. Medusa + vitrine sob medida. Painel robusto, mas hospedagem mais pesada (não cabe no grátis) e
   as integrações brasileiras teriam de ser escritas do mesmo jeito.

O dono escolheu o 1.

## Decisões técnicas (escolhas do construtor, corrigíveis)

- **Stack:** Next.js (App Router) + TypeScript + Tailwind CSS; Prisma + PostgreSQL; zod para
  validação; Vitest para testes; Playwright para teste ponta a ponta.
- **Hospedagem recomendada:** Netlify Free (site) + Neon Free (banco) + Resend Free (e-mail).
  O código não depende da Netlify: roda em qualquer host Node (há Dockerfile).
- **Vitrine estática com revalidação:** páginas de produto/categoria geradas com cache; quando o
  dono salva algo no painel, as páginas afetadas são revalidadas. Carrinho fica no navegador
  (localStorage) e é revalidado no servidor no checkout (preço sempre vem do banco).
- **Pagamento:** interface `PaymentProvider` com implementação Mercado Pago (Payment Brick no
  navegador + API `/v1/payments` no servidor + webhook com verificação de assinatura) e
  implementação `fake` para desenvolvimento/testes. Se o dono usar outro sistema (Pagar.me,
  Asaas…), troca-se a implementação.
- **Frete:** interface `ShippingProvider` com Melhor Envio (`/api/v2/me/shipment/calculate`, usa
  peso/medidas/valor segurado de cada item) e `fake`. CEP de origem e dias de preparo ficam nas
  configurações. Itens marcados "frete sob consulta" (importados com peso > 30 kg ou maior lado >
  100 cm) e carrinhos sem nenhuma cotação válida não vão para o pagamento: viram orçamento.
- **Preço:** custo (do fornecedor) × (1 + markup). Markup padrão **40% sobre o custo**, ajustável
  por categoria e por produto. Preço final arredondado para terminar em ,90. Valores em centavos.
  Desconto no Pix configurável (padrão 5%). Parcelamento exibido "em até N×" (configurável).
- **Orçamento obrigatório:** produtos acima de um limite configurável (padrão R$ 10.000) ou
  marcados manualmente mostram "Solicitar orçamento" em vez de "Comprar".
- **Disponibilidade:** "Pronta entrega" (em estoque no fornecedor), "Sob encomenda" (previsão de
  120 dias na cotação → prazo mostrado) e "Sob consulta". Não há contagem de estoque.
- **Códigos próprios:** cada produto ganha SKU Simumed (`SM-0001`…); o código do fornecedor e o
  custo ficam só no painel.
- **Nomes:** normalizados da cotação (caixa alta → frase; "C/" → "com", "P/" → "para").
- **Fotos e descrições:** as miniaturas do PDF são pequenas demais. O site entra no ar com
  ilustração de categoria e ficha técnica (medidas, peso, garantia) e o dono sobe fotos pelo
  painel quando tiver autorização/material do fornecedor ou fotos próprias.
- **Imagens enviadas:** interface de armazenamento; implementação em disco local (dev/VPS) e
  Netlify Blobs (produção grátis).
- **Painel:** `/admin`, login por e-mail e senha (bcrypt + cookie de sessão assinado). Usuário
  criado por script.
- **E-mails:** confirmação de pedido, pagamento aprovado, pedido enviado (rastreio), orçamento e
  manutenção recebidos (cliente + aviso ao dono). Provedor via SMTP/Resend; em dev, no console.
- **Segurança:** preços e totais sempre recalculados no servidor; webhook com assinatura;
  rate-limit e campo-isca nos formulários; páginas legais (LGPD, CDC art. 49 — 7 dias de
  arrependimento).
- **SEO:** metadados por página, JSON-LD de Produto, sitemap, robots, URLs `/produtos/[slug]`
  (mesmo padrão da Nuvemshop, para aproveitar links antigos quando os slugs coincidirem).
- **Visual:** azul-marinho profundo + verde-azulado clínico, muito branco, tipografia moderna
  (pacote de fonte instalado localmente). Logo provisório em texto até o dono enviar o oficial.

## Páginas

Públicas: Início · Produtos (busca, filtros, ordenação) · Categoria · Produto · Carrinho ·
Checkout · Pedido (status, QR do Pix, boleto) · Orçamento · Manutenção · Softwares · Sobre ·
Contato · FAQ · Entrega · Trocas e devoluções · Garantia · Privacidade · Termos.

Painel: Login · Resumo · Pedidos (detalhe, status, código de rastreio) · Orçamentos ·
Manutenção · Produtos (lista, edição, fotos, ativo/destaque) · Categorias (markup) ·
Configurações (contato, CNPJ, CEP de origem, Pix, parcelas, limite de orçamento).

## Fases

1. Base, catálogo importado, vitrine completa, orçamento/manutenção/softwares, páginas legais.
2. Carrinho, frete, checkout, pagamento, pedidos, e-mails.
3. Painel administrativo.
4. Publicação: Neon + Netlify + DNS no registro.br + chaves reais (Mercado Pago, Melhor Envio,
   Resend) + teste de compra real + desligar a Nuvemshop.

## O que depende do dono

Logo; nome do sistema de pagamento que já tem; dados obrigatórios do rodapé (razão social,
CNPJ, endereço comercial, WhatsApp, e-mail, Instagram); CEP de onde os produtos saem; quais
softwares vende (ACLS/ATLS/debriefing — marcas/produtos); autorização do fornecedor para fotos e
descrições; confirmação da margem; criação das contas gratuitas (Netlify, Neon, Resend) e as
chaves (por formulário seguro, nunca no chat).

## Deixado para o construtor

Layout fino, textos institucionais (marcados para revisão do dono), mapa de subcategorias,
ilustrações de categoria, detalhes de testes.

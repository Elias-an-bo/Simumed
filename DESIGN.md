# DESIGN.md — Simumed

Sistema visual da loja Simumed. Cada token traz o motivo, para que telas novas continuem no
mesmo sistema mesmo em casos que este arquivo não previu.

## Personalidade

**Precisão clínica, confiança institucional, didática.** Quem compra é coordenador de curso,
setor de compras de hospital, professor e estudante de saúde. Eles precisam sentir que estão
comprando de um fornecedor técnico e sério, não de uma loja de promoções.

- Calmo e confiante: muito branco, contraste alto, poucas cores ao mesmo tempo.
- Técnico sem ser frio: ficha técnica visível, números claros, linguagem direta.
- Nada de vermelho "promoção", contagem regressiva, pop-ups ou excesso de selos.

## Cores

| Token | Valor | Uso | Por quê |
|---|---|---|---|
| `--color-ink` | `#0A1A2F` | títulos, rodapé, faixas escuras | azul-marinho quase preto: autoridade e leitura confortável |
| `--color-navy` | `#123257` | links, ícones, botões secundários | mesma família do ink, mais leve |
| `--color-brand` | `#0B7A72` | botão principal, destaques | verde-azulado clínico (cor de jaleco/centro cirúrgico); branco sobre ele passa AA (≈5:1) |
| `--color-brand-strong` | `#08605A` | hover do botão principal | escurece mantendo o tom |
| `--color-brand-soft` | `#E6F4F2` | fundos de destaque, selos | tinta suave da cor da marca |
| `--color-accent` | `#2B6CB0` | informação, links secundários | azul "informação" sem competir com a marca |
| `--color-warn` | `#B45309` | "sob encomenda", avisos | âmbar: atenção sem alarme |
| `--color-success` | `#15803D` | "pronta entrega", pagamento aprovado | |
| `--color-danger` | `#B91C1C` | erros de formulário | só para erro, nunca para promoção |
| `--color-bg` | `#FFFFFF` | fundo | |
| `--color-surface` | `#F5F7FA` | fundo de seções e de fotos de produto | separa blocos sem linhas |
| `--color-line` | `#E2E8F0` | bordas | |
| `--color-text` | `#1C2A3A` | texto corrido | |
| `--color-muted` | `#5A6B80` | texto auxiliar | passa AA sobre branco |

Regra: no máximo **uma** cor forte por bloco (marca *ou* navy). Âmbar e verde aparecem só em selos de status.

## Tipografia

- **Títulos:** Plus Jakarta Sans (variável), peso 650–800, `letter-spacing: -0.02em`. Geométrica e moderna, transmite tecnologia.
- **Texto:** Inter (variável), 16 px, `line-height: 1.6`. Neutra e muito legível em fichas técnicas.
- **Preços e números:** Inter com `font-variant-numeric: tabular-nums` para alinhar valores.
- Escala: 12 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48 · 60 px. Hero no máximo 60 px no desktop e 36 px no celular.
- Fontes instaladas localmente (pacotes `@fontsource-variable`), sem depender de Google Fonts.

## Espaço, forma e profundidade

- Grade de 4 px. Seções: 96 px de respiro no desktop, 64 px no celular.
- Contêiner máximo 1240 px; margens laterais 16 px (celular), 24 px (tablet), 32 px (desktop).
- Raio: 10 px em botões e campos, 16 px em cartões, pílula em selos.
- Sombras discretas: repouso `0 1px 2px rgb(10 26 47 / 6%)`; hover `0 12px 32px -16px rgb(10 26 47 / 28%)`.
- Bordas de 1 px `--color-line` em vez de sombras fortes.

## Componentes

- **Botão principal:** fundo `brand`, texto branco, 44 px de altura mínima (toque), peso 600.
- **Botão secundário:** borda `navy`, texto `navy`, fundo branco.
- **Cartão de produto:** foto 4:3 sobre `surface`; selo de disponibilidade; nome em 2 linhas no máximo; preço grande + "no Pix" + parcelado; para itens sob orçamento, "Sob orçamento" no lugar do preço.
- **Selos:** pílula pequena, texto 12 px peso 600, fundo suave da cor do status.
- **Cabeçalho:** faixa fina superior (atendimento a instituições, WhatsApp), logo, busca larga, carrinho; navegação por categorias abaixo.
- **Rodapé:** fundo `ink`, texto claro, colunas (Loja, Atendimento, Institucional), dados legais da empresa.

## Imagens

- Fotos de produto sobre fundo claro e neutro, sem montagem.
- Sem foto ainda: ilustração da categoria (ícone de traço sobre `brand-soft`), nunca imagem quebrada.
- Fotos de ambiente (laboratório, simulação) só quando forem reais da Simumed ou de clientes.

## Movimento

150–200 ms, `ease-out`, só em hover/foco/abertura de menus. Sem parallax nem carrossel automático.

## Voz

"Você", frases curtas, termos técnicos corretos (RCP, BLS, ACLS, ATLS). Sem exageros
("o melhor do Brasil"). Sempre dizer prazo, garantia e forma de pagamento com clareza.

# Painel Bella Si – Etapa 1 (versão leve): especificação

- Data: 2026-11-09
- Status: aguardando revisão do João
- Versão: leve (decisão do João em 2026-11-09). A versão completa foi trocada por esta. O que saiu está na seção 10.
- Fontes: Brain 2 (`Projetos\Painel Bella Si\`) e os esboços aprovados (canvas "Painel Bella Si – Esboços": Main, Pedidos, Entregas).

## 1. Objetivo

Uma página leve, com o visual da Bella Si, que funciona como uma planilha de pedidos bem desenhada:

- a Simone marca os pedidos da semana em uma grade (cliente × dia);
- o app conta o que cozinhar hoje, no total e por leva;
- o Bruno vê as entregas da leva no celular e marca cada entrega.

**Critério de sucesso:** uma semana de uso real pela Simone sem papel de apoio.

## 2. Telas

Menu inferior em todas as telas: **Hoje, Pedidos, Entregas, Cadastros.**

| Rota | Tela | Conteúdo |
|---|---|---|
| `/entrar` | Entrar | Logo, campo "PIN" (teclado numérico), botão "Entrar". Erro: "PIN errado. Tente de novo." |
| `/hoje` | Hoje | Igual ao esboço Main. Logo, "Hoje, quarta 11/11", "Pedidos fecham às 9h · faltam 1h20" (depois: "Pedidos fechados"; sábado e domingo: "Sem entregas hoje"). "O que cozinhar": uma linha por opção com o nome do prato e a quantidade; linha "Total". Caixa laranja-clara com os marmitões ("**3 marmitões** hoje: Michel, Ana, Sr. Jorge"). Bloco "Por leva": 3 linhas com o resumo de cada leva (ex.: "1ª leva · 6 PD, 2 Veg, 3 Basic C"). |
| `/pedidos` | Pedidos da semana | Igual ao esboço Pedidos. "Pedidos · 09 a 13/11" com setas de semana, busca por nome, grade cliente × Seg–Sex. Um toque na célula abre uma folha de baixo: as 6 opções em botões grandes (com o nome do prato do cardápio), "Sem pedido", quantidade (− / +), "Marmitão", "Anotação", "Salvar". Legenda das siglas. Botão "Repetir semana passada". |
| `/entregas` | Entregas | Igual ao esboço Entregas. Abas "1ª leva / 2ª leva / 3ª leva", "X de Y entregues". Card por parada: número, nome, endereço, pedido, anotações em destaque, "Abrir mapa" e "Entregue". Um segundo toque em "Entregue ✓" desfaz. |
| `/cadastros` | Cadastros | Duas abas: **Clientes** (busca, lista, "+ Novo cliente", formulário, desativar) e **Cardápio** (semana; para cada dia, prato do dia e vegetariano com descrição; os 4 basiquinhos aparecem fixos). |

## 3. Regras do negócio

| Regra | Comportamento |
|---|---|
| Dias de entrega | Segunda a sexta, só almoço. A semana é identificada pela data da segunda-feira. |
| Fuso horário | `America/Sao_Paulo` em todas as datas. |
| Corte | 9h, fixo no código (constante `HORARIO_CORTE`). Depois do corte, a tela mostra "Pedidos fechados". A Simone ainda pode editar. |
| Opções | `PD` (prato do dia), `VEG` (vegetariano), `BASIC_C` (patinho), `BASIC_F` (frango), `BASIC_O` (omelete), `BASIC_T` (tilápia). Siglas: PD, V, Basic C, Basic F, Basic O, Basic T. Marmitão = "M". |
| Pedido | Um pedido por cliente por dia: opção, quantidade (1 a 3), marmitão (sim/não), anotação. |
| Marmitão | Vale para o pedido do dia. Cliente com "marmitão padrão" já começa com o marmitão marcado. |
| Plano 01 | 6 marmitas na semana. Na sexta, a folha começa com quantidade 2. |
| Plano 02 | 5 marmitas na semana. Avulso: sem meta. |
| Levas | 3 levas. Cada cliente tem uma leva e uma ordem na rota. Empate na ordem: ordem alfabética do nome. |
| Repetir semana passada | Copia os pedidos da semana anterior só para os dias vazios. Não apaga nada. Ignora clientes desativados. |
| Cliente desativado | Some da grade e dos cadastros ativos. Os pedidos já feitos continuam em Hoje e Entregas. |

## 4. Acesso

- Um PIN único para a Simone e o Bruno, na variável de ambiente `APP_PIN`.
- Depois do PIN certo, o app grava um cookie `httpOnly` assinado (`AUTH_SECRET`), válido por 90 dias.
- Sem cookie válido, toda rota manda para `/entrar`.
- Depois de 5 PINs errados seguidos, o app espera 30 segundos antes de aceitar outro (contador no cookie).

## 5. Arquitetura

- **Next.js (App Router) + TypeScript** na Vercel, domínio grátis `painel-bella-si.vercel.app`, time `sinapse-labs`.
- Leitura em Server Components. Gravação por Server Actions.
- **Banco:** Postgres com Drizzle. Produção: Neon (grátis, criado pelo painel da Vercel). Computador e testes: PGlite (sem instalar nada).
- Regras do negócio em funções puras (`src/dominio/`), testadas primeiro.
- **Fontes:** Nunito e Dancing Script por `next/font`. O navegador não chama o Google.

## 6. Dados (3 tabelas)

| Tabela | Campos |
|---|---|
| `clientes` | id, nome, telefone, endereco, bairro (texto), leva (1–3), ordem_rota, plano (`P01` \| `P02` \| `AVULSO`), marmitao_padrao, anotacao_fixa, ativo |
| `cardapio_dia` | data (chave), prato_dia, prato_dia_desc, veg, veg_desc |
| `pedidos` | id, cliente_id, data, opcao, quantidade, marmitao, anotacao, entregue_em. Único: (cliente_id, data). |

Os basiquinhos ficam fixos no código.

## 7. Design system

Tokens em `src/ui/tokens.css`. Os componentes usam só tokens.

| Token | Valor | Uso |
|---|---|---|
| `--cor-verde` | #3F5A1E | cabeçalhos, botões principais |
| `--cor-verde-escuro` | #2B3F14 | texto sobre verde-claro |
| `--cor-verde-folha` | #6E9A2E | só decoração |
| `--cor-verde-claro` | #DCE8C8 | célula "V", "Entregue ✓" |
| `--cor-verde-fundo` | #E8EFDC | card entregue |
| `--cor-laranja` | #E8742A | selo com texto escuro |
| `--cor-laranja-texto` | #B4521A | célula com marmitão |
| `--cor-laranja-claro` | #FBE9DC | caixa de aviso (texto #7A3410) |
| `--cor-creme` | #F7F3E8 | fundo |
| `--cor-texto` | #24301A | texto principal |
| `--cor-texto-suave` | #4A5440 | texto secundário |
| `--cor-borda` | #E2DCCB | linhas |

- Nunito 400/600/800; Dancing Script 700 só no logo. Corpo 18 px, mínimo 16 px.
- Botões principais com 56 px; células da grade com 44 px; menu inferior com 64 px.
- Contraste mínimo de 4.5:1 (teste automático). Foco visível. Efeitos de mouse só em `@media (hover: hover)`.

## 8. Erros

- Server Actions validam com Zod e devolvem `{ ok: true }` ou `{ ok: false, erro }`, com frase simples (ex.: "Escolha um dia de segunda a sexta.").
- Falha de conexão: página de erro com o botão "Tentar de novo".

## 9. Testes e publicação

- **Vitest:** regras de `src/dominio/` (teste primeiro) e consultas do banco com PGlite.
- **Playwright:** um fluxo (PIN → marcar pedido → ver Hoje → marcar entrega) e capturas de todas as telas em 360 e 390 px. O Claude olha as capturas e corrige.
- **Revisão:** `web-design-guidelines` e revisão final de código por um revisor novo.
- **Publicação:** o João cria o repositório `Joaofelipe26/painel-bella-si` no GitHub e o banco Neon no painel da Vercel. Variáveis: `DATABASE_URL`, `AUTH_SECRET`, `APP_PIN`.

## 10. Fora desta versão (para depois, sem refazer nada)

- Pedidos chegando (cards do bot), "+ Novo pedido", tabela `pedidos_pendentes` e webhook do WhatsApp.
- Linha de produção no tablet.
- Relatório do mês.
- Tela de configurações (horários ficam no código).
- Contas separadas para a Simone e o Bruno.
- Tabela de bairros com taxa.
- Link do cliente (Etapa 2).

## 11. Decisões tomadas pelo Claude (para registrar no Brain 2)

- Versão leve com 4 telas (decisão do João).
- PIN único, no lugar de 2 contas.
- Corte fixo às 9h no código.
- Marmitão vale para o pedido do dia; preço fora do app.
- Folha de opções na grade, no lugar de "tocar várias vezes para trocar".
- PGlite no computador e nos testes; Neon na produção.
- Resumo por leva na tela Hoje, no lugar da tela do tablet.

# Painel Bella Si – Etapa 1: especificação

- Data: 2026-11-09
- Status: aguardando revisão do João
- Fontes: Brain 2 (`Projetos\Painel Bella Si\`: nota central, Briefing, Decisões, Plano, Pesquisa - Bot do WhatsApp) e os esboços aprovados (canvas "Painel Bella Si – Esboços").

## 1. Objetivo

A Simone organiza os pedidos da marmitaria Bella Si à mão, a partir do WhatsApp. A Etapa 1 entrega um painel web para a Simone e para o Bruno:

- a Simone lança os pedidos da semana em poucos minutos;
- o app mostra a produção do dia (o que cozinhar) e a produção por leva;
- o Bruno vê as entregas da leva no celular e marca cada entrega;
- a Simone consulta as quantidades do mês de cada cliente para a cobrança.

**Critério de sucesso:** uma semana de uso real pela Simone sem papel de apoio.

## 2. Escopo

**Dentro:**
- Telas: Login, Hoje, Pedidos da semana, Entregas, Pedidos chegando, Linha de produção (tablet), Clientes, Bairros, Cardápio da semana, Mês e Configurações.
- Tabela `pedidos_pendentes`, tela de conferência (cards) e lançamento manual ("+ Novo pedido").
- Rota de webhook vazia e documentada para o bot do WhatsApp.

**Fora:**
- Link do cliente (Etapa 2). Os esboços ClienteDia e ClienteSemana ficam para a Etapa 2.
- Bot ligado, resposta automática, áudio.
- Pagamento e valores em R$ nos relatórios.

## 3. Regras do negócio

| Regra | Comportamento |
|---|---|
| Dias de entrega | Segunda a sexta, só almoço. A semana é identificada pela data da segunda-feira. |
| Fuso horário | Todas as datas e horários usam `America/Sao_Paulo`. |
| Corte do pedido | Um horário de corte único por dia (padrão 09:00), ajustável em Configurações. Depois do corte, o dia mostra "Pedidos fechados". A Simone e o Bruno ainda podem editar. |
| Opções | `PD` (prato do dia), `VEG` (vegetariano), `BASIC_C` (patinho), `BASIC_F` (frango), `BASIC_O` (omelete), `BASIC_T` (tilápia). |
| Siglas na tela | PD, V, Basic C, Basic F, Basic O, Basic T. Marmitão = "M". Na produção, "Veg" no lugar de "V". |
| Pedido | Um pedido por cliente por dia. Campos: opção, quantidade (1 a 3), marmitão (sim/não), anotação. |
| Marmitão | Vale para o pedido inteiro do dia. O cliente pode ter "marmitão padrão": o app marca o marmitão sozinho em cada pedido novo dele. |
| Plano 01 | Meta de 6 marmitas na semana. Ao lançar a sexta, o app sugere quantidade 2 (a 6ª é para o sábado). |
| Plano 02 | Meta de 5 marmitas na semana. |
| Avulso | Sem meta. |
| Aviso de meta | Na grade da semana, o app mostra um aviso quando o total do cliente de plano é diferente da meta. O aviso não bloqueia. |
| Levas | 3 levas (1ª, 2ª, 3ª). Cada cliente tem uma leva e uma ordem na rota. O horário de saída de cada leva fica em Configurações (padrão 11:00, 11:40, 12:20). |
| Bairro | Cada cliente tem um bairro. O bairro tem uma taxa de entrega, só para registro. A taxa não entra em contas nesta etapa. |
| Total do mês | Por cliente: quantidade de marmitas, de marmitões e de dias com entrega. Sem R$. |
| Repetir semana passada | Copia os pedidos da semana anterior para a semana aberta. Só preenche dias vazios. Não apaga nada. |

## 4. Usuários e acesso

- 2 contas: Simone e Bruno. As duas são admin (decisão de 2026-11-09).
- Depois do login, a Simone entra em **Hoje** e o Bruno entra em **Entregas**.
- Senhas: definidas por variáveis de ambiente (`SENHA_SIMONE`, `SENHA_BRUNO`). O script de dados iniciais grava só o hash (bcrypt).
- Sessão: cookie `httpOnly`, assinado (JWT HS256 com `AUTH_SECRET`), validade de 30 dias.
- Um middleware manda para `/login` toda rota sem sessão, exceto `/login` e `/api/webhook/whatsapp`.

## 5. Arquitetura

- **Next.js (App Router) + TypeScript.** Leitura nos Server Components. Gravação por Server Actions.
- **Banco:** Postgres com Drizzle ORM.
  - Produção: Neon (driver `@neondatabase/serverless`), conectado pela Vercel.
  - Computador e testes: PGlite (Postgres dentro do processo). Sem `DATABASE_URL`, o app usa PGlite.
  - Migrações geradas pelo `drizzle-kit`. O build da Vercel aplica as migrações antes do `next build`.
- **Fontes:** Nunito e Dancing Script por `next/font`. O navegador não chama o Google.
- **Hospedagem:** Vercel, time `sinapse-labs`, projeto `painel-bella-si`. Repositório `Joaofelipe26/painel-bella-si`.

### Pastas

```
src/
  dominio/      regras puras (sem banco, sem React), com testes ao lado
  db/           schema Drizzle, conexão, consultas, dados iniciais
  auth/         sessão, login, middleware
  ui/           tokens.css, componentes (Botao, Card, Cabecalho, MenuInferior, Folha, Aviso)
  app/          rotas e telas
tests/e2e/      Playwright
```

Cada tela chama funções de `db/` para ler e de `dominio/` para calcular. As telas não fazem contas.

## 6. Dados (tabelas)

| Tabela | Campos principais |
|---|---|
| `usuarios` | id, nome, papel (`simone` \| `bruno`), senha_hash |
| `bairros` | id, nome (único), taxa_centavos |
| `clientes` | id, nome, telefone, endereco, bairro_id, leva (1–3), ordem_rota, plano (`P01` \| `P02` \| `AVULSO`), marmitao_padrao, anotacao_fixa, ativo |
| `cardapio_dia` | data (chave), prato_dia, prato_dia_desc, veg, veg_desc |
| `pedidos` | id, cliente_id, data, opcao, quantidade, marmitao, anotacao, origem (`manual` \| `bot`), pronto_em, entregue_em. Único: (cliente_id, data). |
| `pedidos_pendentes` | id, cliente_id (pode ser vazio), nome_contato, telefone, mensagem, recebido_em, itens (JSON: data, opcao, quantidade, marmitao, anotacao), aviso, status (`pendente` \| `confirmado` \| `descartado`) |
| `levas_do_dia` | data, leva, pronta_em. Chave: (data, leva). |
| `configuracoes` | chave, valor (`horario_corte`, `hora_leva_1`, `hora_leva_2`, `hora_leva_3`) |

Os basiquinhos são fixos no código (4 opções). Eles não ficam no cardápio do dia.

## 7. Regras puras (`src/dominio/`), testadas primeiro

1. `diaEstaAberto(data, agora, horarioCorte)`: verdadeiro até o horário de corte do dia, no fuso de São Paulo. Falso em sábado e domingo.
2. `contarProducao(pedidos)`: total por opção, total geral e lista de marmitões (nome do cliente). Soma as quantidades.
3. `contarProducaoPorLeva(pedidos, clientes)`: o mesmo resumo por leva, e a lista de pedidos de cada leva na ordem da rota.
4. `quantidadeSugerida(plano, diaDaSemana)`: 2 para Plano 01 na sexta. 1 nos outros casos.
5. `conferirMetaSemanal(plano, pedidosDaSemana)`: total, meta e diferença. Avulso não tem meta.
6. `copiarSemanaAnterior(pedidosAnteriores, pedidosAtuais)`: lista de pedidos novos, só para os dias vazios.
7. `totalDoMes(pedidos, mes)`: por cliente, marmitas, marmitões e dias com entrega.
8. `listaDeEntregas(pedidos, clientes, leva)`: paradas na ordem da rota, com endereço, resumo do pedido, anotação fixa + anotação do pedido e status.

## 8. Telas

Todas seguem os esboços: fundo creme, cabeçalho verde-escuro, cards brancos com raio de 16 px, letra do corpo de 18 px, mínimo de 16 px, botões de 56 px.

| Rota | Tela | Conteúdo |
|---|---|---|
| `/login` | Login | Escolher "Simone" ou "Bruno" (2 botões grandes) e digitar a senha. |
| `/hoje` | Hoje | Logo, data, "Pedidos fecham às 9h · faltam 1h20". Faixa laranja "N pedidos para conferir" (abre `/chegando`). "O que cozinhar": linha por opção com o nome do prato e a quantidade. Total. Caixa dos marmitões. |
| `/pedidos` | Pedidos da semana | Seletor de semana, busca por nome, grade cliente × Seg–Sex. Um toque na célula abre uma folha de baixo com: opções (botões grandes), quantidade, marmitão, anotação, "Sem pedido". Legenda das siglas. Aviso de meta por cliente. Botão "Repetir semana passada". |
| `/entregas` | Entregas | Abas 1ª, 2ª e 3ª leva. "X de Y entregues". Card por parada: número, nome, endereço, pedido, anotação em destaque, "Abrir mapa" (Google Maps com o endereço) e "Entregue". Um segundo toque em "Entregue ✓" desfaz. |
| `/chegando` | Pedidos chegando | Cards de `pedidos_pendentes`: nome, hora, mensagem, itens lidos, endereço e leva, aviso "Confira" com borda laranja. Botões "Corrigir" e "Confirmar". Estado vazio "Tudo conferido!". Botão fixo "+ Novo pedido (áudio ou ligação)". |
| `/chegando/novo` | Novo pedido | Escolher cliente, dias, opção, quantidade, marmitão e anotação. Grava direto em `pedidos`. "Corrigir" abre a mesma tela com os dados do card; ao salvar, o card fica `confirmado`. "Confirmar" grava os itens do card em `pedidos` (substitui o pedido do mesmo cliente e dia) e marca o card como `confirmado`. Um card sem cliente não tem "Confirmar", só "Corrigir". |
| `/producao` | Linha de produção | Tablet na horizontal (1180×820). 3 colunas, uma por leva: horário, resumo (ex.: "6 PD"), pedidos na ordem da rota. Um toque risca o pedido (pronto). Botão "Leva pronta → Bruno". Selo laranja com pendentes. |
| `/mais` | Mais | Links grandes: Clientes, Bairros, Cardápio, Mês, Linha de produção, Configurações, Sair. |
| `/clientes` | Clientes | Busca, lista e formulário de cliente (criar, editar, desativar). |
| `/bairros` | Bairros | Lista e formulário (nome, taxa). |
| `/cardapio` | Cardápio da semana | Seletor de semana. Para cada dia: prato do dia + descrição, vegetariano + descrição. Os 4 basiquinhos aparecem fixos, só leitura. |
| `/mes` | Mês | Seletor de mês. Tabela: cliente, marmitas, marmitões, dias com entrega. Total geral. |
| `/configuracoes` | Configurações | Horário de corte e horário de cada leva. |

Menu inferior (celular): Hoje, Pedidos, Entregas, Mais. A tela de produção não tem menu inferior. Ela tem um botão "Voltar".

## 9. Design system

Tokens em `src/ui/tokens.css` (variáveis CSS). Os componentes usam só tokens.

| Token | Valor | Uso |
|---|---|---|
| `--cor-verde` | #3F5A1E | cabeçalhos, botões principais, texto de destaque |
| `--cor-verde-escuro` | #2B3F14 | texto sobre verde-claro, hover |
| `--cor-verde-folha` | #6E9A2E | só decoração (nunca texto) |
| `--cor-verde-claro` | #DCE8C8 / #E8EFDC | fundos de "feito", chips |
| `--cor-laranja` | #E8742A | fundo de selo com texto escuro |
| `--cor-laranja-texto` | #B4521A | botão "+ Novo pedido", marmitão na grade |
| `--cor-laranja-claro` | #FBE9DC | caixas de aviso (texto #7A3410) |
| `--cor-creme` | #F7F3E8 | fundo das telas |
| `--cor-texto` | #24301A | texto principal |
| `--cor-texto-suave` | #4A5440 | texto secundário |
| `--cor-borda` | #E2DCCB | linhas e bordas |

- Tipografia: Nunito 400/600/800. Dancing Script 700 só no logo "Bella Si". Escala: 16, 18, 20, 22, 26, 28 px.
- Espaço: 4, 8, 12, 16, 20, 24 px. Raio: 10, 12, 14, 16, 20 px.
- Toque: botões principais com 56 px de altura. Itens da grade com 44 px no mínimo.
- Contraste mínimo de 4.5:1 em todo texto. O teste de contraste roda junto com os testes das regras.
- Foco visível em todos os controles. Efeitos de mouse só dentro de `@media (hover: hover)`.

## 10. Bot do WhatsApp (só preparo)

- Rota `/api/webhook/whatsapp`.
  - `GET`: responde 501 "Bot ainda não ligado".
  - `POST`: responde 501 e não grava nada.
- O README explica o que a etapa do bot vai fazer: verificar o token da Meta, ler a mensagem, criar um registro em `pedidos_pendentes` com `status = pendente`.
- Os dados iniciais de demonstração criam 3 cards pendentes de exemplo, para testar a tela.

## 11. Erros

- As Server Actions validam a entrada (Zod) e devolvem `{ ok: true }` ou `{ ok: false, erro: "<frase simples>" }`.
- A tela mostra o erro em uma caixa de aviso, em português simples (ex.: "Escolha um cliente.").
- Sem conexão com o banco: página de erro com o botão "Tentar de novo".

## 12. Testes

- **Vitest:** todas as regras de `src/dominio/` (TDD: teste primeiro). Testes das consultas com PGlite.
- **Playwright:** fluxo principal com dados de demonstração (login, lançar pedido, ver Hoje, marcar entrega, confirmar card). Capturas em 360×800, 390×844 e 1180×820. O Claude olha cada captura e corrige.
- **Revisão:** `web-design-guidelines` para acessibilidade e UX. Revisão final de código por um revisor novo.
- **Antes de dizer "pronto":** `npm test`, `npm run build` e Playwright passam.

## 13. Publicação

1. Criar o repositório `Joaofelipe26/painel-bella-si` no GitHub.
2. Criar o projeto `painel-bella-si` na Vercel (time `sinapse-labs`), ligado ao repositório.
3. O João cria o banco Neon no painel da Vercel (Storage → Create Database → Neon). Este passo pede o aceite de termos. Só o João pode fazer.
4. Variáveis de ambiente: `DATABASE_URL` (automática pelo Neon), `AUTH_SECRET`, `SENHA_SIMONE`, `SENHA_BRUNO`.
5. Rodar os dados iniciais (usuários, bairros de exemplo, configurações) uma vez.

## 14. Decisões tomadas pelo Claude (para registrar no Brain 2)

- Total do mês só com quantidades (resposta do João).
- Horário de corte único por dia, padrão 9h. Depois do corte, o admin ainda edita.
- Marmitão vale para o pedido do dia inteiro. Acréscimo de preço fora desta etapa.
- Folha de opções na grade, no lugar de "tocar várias vezes para trocar".
- PGlite no computador e nos testes; Neon na produção.
- "Mais" no menu inferior, no lugar de "Clientes".
- Sexta com mais de um prato do dia: fora desta etapa. O campo do prato do dia é texto livre.

## 15. Pendências com a Simone (não bloqueiam o código)

- Preço do marmitão.
- Taxa de cada bairro.
- Horário de cada leva e horário de corte reais.

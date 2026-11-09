# Painel Bella Si – Etapa 1 (versão leve) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página leve, com o visual da Bella Si, para a Simone marcar os pedidos da semana, ver o que cozinhar hoje e para o Bruno marcar as entregas.

**Architecture:** Next.js App Router. Regras do negócio em funções puras (`src/dominio/`), testadas primeiro. Leitura em Server Components; gravação em Server Actions que chamam consultas Drizzle (`src/db/consultas/`), que recebem o `db` como parâmetro. PGlite no computador e nos testes; Neon na Vercel.

**Tech Stack:** Next.js (última estável) + React + TypeScript, Drizzle ORM + drizzle-kit, `@electric-sql/pglite`, `@neondatabase/serverless`, `jose`, `zod`, Vitest, Playwright, CSS Modules + variáveis CSS.

**Spec:** `docs/superpowers/specs/2026-11-09-painel-bella-si-etapa-1-design.md`

## Global Constraints

- Fuso `America/Sao_Paulo`. Datas trafegam como texto `YYYY-MM-DD`. Use `Intl.DateTimeFormat`; sem biblioteca de datas.
- `HORARIO_CORTE = '09:00'`, constante em `src/dominio/tipos.ts`.
- Opções: `PD`, `VEG`, `BASIC_C`, `BASIC_F`, `BASIC_O`, `BASIC_T`. Siglas: PD, V, Basic C, Basic F, Basic O, Basic T; marmitão "M".
- Planos: `P01` (6), `P02` (5), `AVULSO`. Quantidade por pedido: 1 a 3.
- Textos da interface em português do Brasil, copiados dos esboços quando existirem.
- Corpo 18 px, mínimo 16 px. Botões principais 56 px; células da grade 44 px; menu inferior 64 px. Contraste mínimo 4.5:1.
- Cores só por tokens de `src/ui/tokens.css`.
- Fontes por `next/font/google` (Nunito 400/600/800, Dancing Script 700). Nenhum `<link>` para o Google.
- Efeitos de mouse só em `@media (hover: hover)`. Foco visível em todos os controles.
- Server Actions: validação Zod; devolvem `{ ok: true } | { ok: false; erro: string }` com frase simples em português.
- Commits: assunto em inglês STE, imperativo, até 50 caracteres; autor `Felipe <felipejoaoalmeida26@gmail.com>`; rodapé `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Noite em UTC:** às 22h30 em São Paulo já é o dia seguinte em UTC. "Hoje" e o corte usam o dia de São Paulo. Teste em Task 1.
2. **Toque duplo em "Entregue":** dois toques rápidos não podem deixar o estado trocado; a ação recebe o estado desejado (`entregue: boolean`), não "inverter". Teste em Task 3.
3. **Cliente desativado:** some da grade e de "Repetir semana passada"; os pedidos feitos continuam em Hoje e Entregas. Testes em Tasks 2 e 3.
4. **Ordem da rota empatada:** mesma leva e mesma ordem → ordem alfabética. Teste em Task 2.
5. **Dia sem cardápio:** Hoje e a folha mostram "Prato do dia" / "Vegetariano" sem nome do prato, sem erro. Teste em Task 2 (`nomeDaLinha`).

---

## File Structure

```
src/dominio/tipos.ts        tipos e constantes
src/dominio/datas.ts        dia de SP, semana, corte
src/dominio/producao.ts     contagem total e por leva, ordem da rota, nomes das linhas
src/dominio/semana.ts       quantidade sugerida, copiar semana anterior
src/dominio/entregas.ts     lista de entregas, resumo do pedido
src/db/schema.ts            3 tabelas
src/db/cliente.ts           criarDb / getDb (PGlite ou Neon)
src/db/teste.ts             criarDbDeTeste
src/db/migrar.ts            script de migração
src/db/semear.ts            dados de demonstração
src/db/consultas/{clientes,cardapio,pedidos}.ts
src/auth/sessao.ts          token, cookie, tentativas de PIN
src/middleware.ts           proteção das rotas
src/ui/tokens.css, src/ui/contraste.ts, src/ui/*.tsx
src/app/layout.tsx, src/app/entrar/, src/app/(painel)/{hoje,pedidos,entregas,cadastros}/
tests/e2e/*.spec.ts
drizzle/                    migrações geradas
```

---

### Task 1: Base do projeto e regras de data

**Files:** projeto Next.js na raiz, `vitest.config.ts`, `src/dominio/tipos.ts`, `src/dominio/datas.ts`, `src/dominio/datas.test.ts`, `.gitignore`, `.env.example`

**Interfaces — Produces:**
```ts
// tipos.ts
export type Opcao = 'PD'|'VEG'|'BASIC_C'|'BASIC_F'|'BASIC_O'|'BASIC_T';
export type Plano = 'P01'|'P02'|'AVULSO';
export type Leva = 1|2|3;
export const OPCOES: readonly Opcao[];                 // nessa ordem
export const SIGLA: Record<Opcao,string>;
export const NOME_BASICO: Record<'BASIC_C'|'BASIC_F'|'BASIC_O'|'BASIC_T',string>; // "Patinho moído", "Filé de frango grelhado", "Omelete de legumes", "Filé de tilápia grelhado"
export const HORARIO_CORTE = '09:00';
export interface Pedido { id?: number; clienteId: number; data: string; opcao: Opcao; quantidade: number; marmitao: boolean; anotacao: string|null; entregueEm?: Date|null }
export interface Cliente { id: number; nome: string; telefone: string|null; endereco: string; bairro: string|null; leva: Leva; ordemRota: number; plano: Plano; marmitaoPadrao: boolean; anotacaoFixa: string|null; ativo: boolean }
export interface CardapioDia { data: string; pratoDia: string|null; pratoDiaDesc: string|null; veg: string|null; vegDesc: string|null }
// datas.ts
hojeSP(agora: Date): string; diaDaSemana(data: string): number /* 0 = domingo */;
segundaDaSemana(data: string): string; diasUteis(segunda: string): string[]; somarDias(data: string, n: number): string;
diaEstaAberto(data: string, agora: Date, corte?: string): boolean; minutosAteCorte(data: string, agora: Date, corte?: string): number|null;
```

- [ ] **Step 1: Criar o projeto** — `npx create-next-app@latest . --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*" --use-npm` (manter `docs/`). `npm i -D vitest`; `vitest.config.ts` com alias `@` → `src`; script `"test": "vitest run"`. Adicionar `.pglite/`, `test-results/`, `playwright-report/`, `.env*.local` ao `.gitignore`.
- [ ] **Step 2: Testes que falham** em `datas.test.ts`:

```ts
expect(hojeSP(new Date('2026-11-12T01:30:00Z'))).toBe('2026-11-11');
expect(segundaDaSemana('2026-11-13')).toBe('2026-11-09');
expect(segundaDaSemana('2026-11-15')).toBe('2026-11-09');
expect(diasUteis('2026-11-30')).toEqual(['2026-11-30','2026-12-01','2026-12-02','2026-12-03','2026-12-04']);
expect(diaEstaAberto('2026-11-11', new Date('2026-11-11T11:59:00Z'))).toBe(true);   // 08:59 SP
expect(diaEstaAberto('2026-11-11', new Date('2026-11-11T12:00:00Z'))).toBe(false);  // 09:00 SP
expect(diaEstaAberto('2026-11-12', new Date('2026-11-11T15:00:00Z'))).toBe(true);   // dia futuro
expect(diaEstaAberto('2026-11-10', new Date('2026-11-11T10:00:00Z'))).toBe(false);  // dia passado
expect(diaEstaAberto('2026-11-14', new Date('2026-11-13T10:00:00Z'))).toBe(false);  // sábado
expect(minutosAteCorte('2026-11-11', new Date('2026-11-11T10:40:00Z'))).toBe(80);   // "faltam 1h20"
expect(minutosAteCorte('2026-11-11', new Date('2026-11-11T12:10:00Z'))).toBeNull();
```

- [ ] **Step 3: Rodar e ver falhar** — `npx vitest run src/dominio/datas.test.ts` → FAIL.
- [ ] **Step 4: Implementar** `tipos.ts` e `datas.ts`. Aritmética de data em `new Date(data + 'T12:00:00Z')`.
- [ ] **Step 5: Rodar e ver passar** — `npm test` → PASS.
- [ ] **Step 6: Commit** — `Add project base and date rules`

---

### Task 2: Regras de produção, semana e entregas

**Files:** `src/dominio/{producao,semana,entregas}.ts` + `.test.ts`

**Interfaces — Consumes:** Task 1. **Produces:**
```ts
// producao.ts
export interface ResumoProducao { porOpcao: Record<Opcao,number>; total: number; marmitoes: { clienteId: number; quantidade: number }[] }
export function contarProducao(pedidos: Pedido[]): ResumoProducao;
export function contarPorLeva(pedidos: Pedido[], clientes: Cliente[]): { leva: Leva; resumo: ResumoProducao }[]; // sempre 3 itens
export function ordenarPorRota<T extends { cliente: Cliente }>(itens: T[]): T[]; // ordemRota, depois nome ('pt-BR')
export function nomeDaLinha(opcao: Opcao, cardapio: CardapioDia|null): { titulo: string; detalhe: string };
// títulos: "Prato do dia", "Vegetariano", "Basiquinho patinho", "Basiquinho frango", "Basiquinho omelete", "Basiquinho tilápia"
// detalhe: nome do prato do cardápio (PD/VEG) ou NOME_BASICO; '' quando o cardápio não tem o prato
export function textoResumoLeva(r: ResumoProducao): string; // "6 PD, 2 Veg, 3 Basic C" (só opções > 0, na ordem de OPCOES; "Veg" para VEG); "Sem pedidos" se total 0
// semana.ts
export function quantidadeSugerida(plano: Plano, data: string): number;
export function copiarSemanaAnterior(anteriores: Pedido[], atuais: Pedido[], clientes: Cliente[]): Pedido[]; // data + 7, sem id/entregueEm
// entregas.ts
export interface Parada { numero: number; cliente: Cliente; pedido: Pedido; resumo: string; anotacoes: string[]; entregue: boolean }
export function listaDeEntregas(pedidos: Pedido[], clientes: Cliente[], leva: Leva): Parada[];
export function resumoDoPedido(p: Pedido): string;
// "1 prato do dia", "2 pratos do dia", "1 vegetariano", "2 vegetarianos", "1 basiquinho patinho|frango|omelete|tilápia", "2 basiquinhos ..."; com marmitão: "1 marmitão prato do dia", "2 marmitões vegetariano"
```

- [ ] **Step 1: Testes que falham**

```ts
// producao.test.ts
const r = contarProducao([p(1,'PD'), p(2,'PD',2), p(3,'VEG'), p(4,'BASIC_T',1,true)]);
expect(r.porOpcao.PD).toBe(3); expect(r.porOpcao.BASIC_C).toBe(0); expect(r.total).toBe(5);
expect(r.marmitoes).toEqual([{ clienteId: 4, quantidade: 1 }]);
expect(contarProducao([]).total).toBe(0);
expect(contarPorLeva([p(A1,'PD'), p(C3,'PD',2)], [A1, C3]).map(l => l.resumo.total)).toEqual([1, 0, 2]);
expect(contarPorLeva([p(99,'PD')], []).every(l => l.resumo.total === 0)).toBe(true); // cliente desconhecido ignorado
// carla: ordemRota 2; ana: ordemRota 2; bia: ordemRota 1
expect(ordenarPorRota([{ cliente: carla }, { cliente: ana }, { cliente: bia }]).map(x => x.cliente.nome)).toEqual(['Bia', 'Ana', 'Carla']);
expect(nomeDaLinha('PD', null)).toEqual({ titulo: 'Prato do dia', detalhe: '' });
expect(nomeDaLinha('PD', { ...vazio, pratoDia: 'Almôndegas de patinho' }).detalhe).toBe('Almôndegas de patinho');
expect(nomeDaLinha('BASIC_F', null)).toEqual({ titulo: 'Basiquinho frango', detalhe: 'Filé de frango grelhado' });
expect(textoResumoLeva(contarProducao([p(1,'PD',6), p(2,'VEG',2)]))).toBe('6 PD, 2 Veg');
// semana.test.ts
expect(quantidadeSugerida('P01', '2026-11-13')).toBe(2);
expect(quantidadeSugerida('P01', '2026-11-12')).toBe(1);
expect(quantidadeSugerida('P02', '2026-11-13')).toBe(1);
// anterior: cliente 1 seg 09 PD, ter 10 VEG; atual: cliente 1 ter 17 BASIC_F
expect(copiarSemanaAnterior(ant, atu, [c1])).toEqual([expect.objectContaining({ clienteId: 1, data: '2026-11-16', opcao: 'PD' })]);
expect(copiarSemanaAnterior(antDoInativo, [], [c2Inativo])).toEqual([]);
expect(copiarSemanaAnterior([sextaQ2Marmitao], [], [c1])[0]).toMatchObject({ quantidade: 2, marmitao: true });
// entregas.test.ts
expect(listaDeEntregas(peds, clientes, 1).map(x => [x.numero, x.cliente.nome])).toEqual([[1,'Fernando'],[2,'Edu']]);
expect(paradaEdu.anotacoes).toEqual(['3 sacolas', 'sem feijão']);  // fixa + do pedido; vazias saem
expect(paradaComEntregueEm.entregue).toBe(true);
expect(listaDeEntregas(pedidoDeInativo, [inativo], 1)).toHaveLength(1); // desativado ainda é entregue
expect(resumoDoPedido({ ...base, opcao: 'PD', quantidade: 1, marmitao: true })).toBe('1 marmitão prato do dia');
expect(resumoDoPedido({ ...base, opcao: 'BASIC_C', quantidade: 2, marmitao: false })).toBe('2 basiquinhos patinho');
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/dominio` → FAIL.
- [ ] **Step 3: Implementar** os 3 arquivos.
- [ ] **Step 4: Rodar e ver passar** — `npm test` → PASS.
- [ ] **Step 5: Commit** — `Add production, week and delivery rules`

---

### Task 3: Banco de dados, consultas e dados de demonstração

**Files:** `drizzle.config.ts`, `src/db/{schema,cliente,teste,migrar,semear}.ts`, `src/db/consultas/{clientes,cardapio,pedidos}.ts` + `.test.ts`

**Interfaces — Consumes:** tipos (Task 1), `copiarSemanaAnterior` (Task 2). **Produces:**
- `schema.ts`: tabelas da spec §6; `date` em modo `string`; `pedidos` com `unique(cliente_id, data)`.
- `cliente.ts`: `type Db`; `criarDb(url?: string): Promise<Db>` (com `url` → Neon http; sem `url` → PGlite em `.pglite/` com migrações aplicadas); `getDb(): Promise<Db>` (singleton, `process.env.DATABASE_URL`).
- `teste.ts`: `criarDbDeTeste(): Promise<Db>` (PGlite em memória + migrações).
- `clientes.ts`: `listarClientes(db, { incluirInativos?: boolean }): Promise<Cliente[]>`, `salvarCliente(db, dados: Omit<Cliente,'id'> & { id?: number }): Promise<Cliente>`, `definirAtivo(db, id, ativo: boolean)`.
- `cardapio.ts`: `cardapioDoDia(db, data): Promise<CardapioDia|null>`, `cardapioDaSemana(db, segunda): Promise<Record<string, CardapioDia|null>>`, `salvarCardapio(db, dias: CardapioDia[])`.
- `pedidos.ts`: `pedidosDoDia(db, data)`, `pedidosDoPeriodo(db, inicio, fim)`, `salvarPedido(db, p)` (upsert por cliente+data), `apagarPedido(db, clienteId, data)`, `definirEntregue(db, pedidoId, entregue: boolean)` (`entregue_em = now()` ou `null`), `repetirSemanaAnterior(db, segunda): Promise<number>`.
- `semear.ts`: `semear(db)` cria os clientes dos esboços (Michel, Edu, Alexandra, J. Marcos, Fernando, Maria Isabel, Ana, Sr. Jorge, Dona Lurdes, Carla, Rita, Paulo; endereços e anotações dos esboços; levas 1–3), o cardápio da semana atual e alguns pedidos de hoje. Rodar duas vezes não duplica. CLI: `npm run db:semear` (flag `--limpar` apaga `.pglite/` antes; recusa se houver `DATABASE_URL`).
- Scripts: `"db:gerar": "drizzle-kit generate"`, `"db:migrar": "tsx src/db/migrar.ts"`, `"db:semear": "tsx src/db/semear.ts"`, `"vercel-build": "tsx src/db/migrar.ts && next build"`.

- [ ] **Step 1: Instalar** — `npm i drizzle-orm @electric-sql/pglite @neondatabase/serverless zod && npm i -D drizzle-kit tsx`
- [ ] **Step 2: Escrever `schema.ts` e gerar a migração** — `npm run db:gerar` → arquivo SQL em `drizzle/`.
- [ ] **Step 3: Testes que falham** (cada um com `criarDbDeTeste()`):

```ts
it('salvarPedido substitui o pedido do mesmo cliente e dia', ...); // 2 saves → 1 linha, opcao 'VEG'
it('definirEntregue com o mesmo valor duas vezes mantém entregue', async () => {
  await definirEntregue(db, id, true); await definirEntregue(db, id, true);
  expect((await pedidosDoDia(db, dia))[0].entregueEm).not.toBeNull();
  await definirEntregue(db, id, false);
  expect((await pedidosDoDia(db, dia))[0].entregueEm).toBeNull();
});
it('cliente desativado some da lista, mas o pedido do dia continua', ...);
it('repetirSemanaAnterior só preenche dias vazios e devolve quantos criou', ...); // 3 anteriores, 1 já existe → 2
it('semear duas vezes não duplica clientes', ...);
```

- [ ] **Step 4: Rodar e ver falhar** — `npx vitest run src/db` → FAIL.
- [ ] **Step 5: Implementar.**
- [ ] **Step 6: Rodar e ver passar** — `npm test` → PASS.
- [ ] **Step 7: Commit** — `Add database schema and queries`

---

### Task 4: Design system, PIN e menu

**Files:** `src/ui/tokens.css`, `src/ui/contraste.ts` + `.test.ts`, `src/ui/{Botao,Card,Cabecalho,MenuInferior,Folha,Aviso,Logo}.tsx` + `.module.css`, `src/app/layout.tsx`, `src/app/globals.css`, `src/auth/sessao.ts` + `.test.ts`, `src/middleware.ts`, `src/app/entrar/{page.tsx,acoes.ts}`, `src/app/(painel)/layout.tsx`, `src/app/page.tsx`

**Interfaces — Produces:**
- Tokens da spec §7, mais `--fonte-texto`, `--fonte-logo`, `--texto-16..28`, `--espaco-1..6` (4–24 px), `--raio-p/m/g/xg` (10/12/16/20), `--altura-botao: 56px`, `--altura-celula: 44px`, `--altura-menu: 64px`.
- `razaoDeContraste(a: string, b: string): number` (fórmula WCAG).
- `<Botao variante="principal"|"contorno"|"claro">`, `<Card estado?="normal"|"feito">`, `<Cabecalho titulo subtitulo? comLogo?>`, `<MenuInferior ativo="hoje"|"pedidos"|"entregas"|"cadastros">`, `<Folha aberta aoFechar titulo>` (`role="dialog"`, `aria-modal`, foco preso, Esc fecha), `<Aviso tipo="info"|"erro"|"ok">`, `<Logo tamanho>`.
- `sessao.ts`: `criarToken(): Promise<string>`, `tokenValido(token: string): Promise<boolean>` (HS256, 90 dias), `pinConfere(pin: string): boolean` (comparação em tempo constante com `APP_PIN`), `podeTentar(tentativas: { erros: number; ultimoErro: number }, agora: number): boolean` (5 erros → espera 30 s).
- `entrarAcao(formData)` Server Action; `sairAcao()`.
- `AUTH_SECRET` e `APP_PIN` obrigatórios em produção; no computador, valores de desenvolvimento (`APP_PIN=1234`) com aviso no console.

- [ ] **Step 1: Testes que falham**

```ts
// contraste.test.ts — todos >= 4.5
[['texto','creme'],['texto-suave','creme'],['#FFFFFF','verde'],['#FFFFFF','laranja-texto'],['texto','laranja'],['#7A3410','laranja-claro'],['verde-escuro','verde-claro'],['verde','#FFFFFF']]
// sessao.test.ts
expect(await tokenValido(await criarToken())).toBe(true);
expect(await tokenValido(tokenAlterado)).toBe(false);
expect(await tokenValido(tokenDe91Dias)).toBe(false);
expect(pinConfere('1234')).toBe(true); expect(pinConfere('1235')).toBe(false);
expect(podeTentar({ erros: 5, ultimoErro: 1000 }, 1000 + 29_000)).toBe(false);
expect(podeTentar({ erros: 5, ultimoErro: 1000 }, 1000 + 31_000)).toBe(true);
```

- [ ] **Step 2: Rodar e ver falhar** → FAIL.
- [ ] **Step 3: Implementar** `contraste.ts`, `sessao.ts`. Se um par de cores der menos de 4.5, escureça o token e anote no commit.
- [ ] **Step 4: Rodar e ver passar** → PASS.
- [ ] **Step 5: Implementar** tokens, fontes, componentes, `/entrar` (logo, "Digite o PIN", `inputmode="numeric"`, `autocomplete="current-password"`, "Entrar"; erros "PIN errado. Tente de novo." e "Muitas tentativas. Espere 30 segundos."), `middleware.ts` (sem cookie válido → `/entrar`; libera `/entrar`, `/_next`, estáticos), `/` → `/hoje`, layout do painel com `MenuInferior` (link "Sair" em Cadastros).
- [ ] **Step 6: Verificar** — `npm test && npm run build` → PASS.
- [ ] **Step 7: Commit** — `Add design tokens and PIN access`

---

### Task 5: Cadastros (clientes e cardápio)

**Files:** `src/app/(painel)/cadastros/{page.tsx,acoes.ts,validacao.ts,validacao.test.ts,FormCliente.tsx,FormCardapio.tsx,cadastros.module.css}`

**Interfaces — Consumes:** consultas de clientes e cardápio (Task 3); `segundaDaSemana`, `diasUteis`, `NOME_BASICO` (Task 1). **Produces:** `salvarClienteAcao`, `definirAtivoAcao`, `salvarCardapioAcao`.

- [ ] **Step 1: Testes que falham** (`validacao.test.ts`): cliente sem nome → "Digite o nome."; sem endereço → "Digite o endereço."; leva 4 → recusa; ordem −1 → recusa; cliente válido → aceita.
- [ ] **Step 2: Rodar, implementar `validacao.ts`, passar.**
- [ ] **Step 3: Tela** com abas "Clientes" e "Cardápio" (`?aba=`).
  - Clientes: busca, lista (nome; plano · leva · bairro), "+ Novo cliente", formulário em `Folha` com todos os campos da spec §6, "Desativar cliente" com confirmação. Seção recolhida "Clientes desativados" com "Reativar".
  - Cardápio: setas de semana; para cada dia, 4 campos; "Salvar semana"; caixa só leitura com os 4 basiquinhos.
- [ ] **Step 4: Verificar** — `npm test && npm run build` → PASS. Commit — `Add customers and menu screens`

---

### Task 6: Pedidos da semana

**Files:** `src/app/(painel)/pedidos/{page.tsx,GradeSemana.tsx,FolhaPedido.tsx,acoes.ts,validacao.ts,validacao.test.ts,pedidos.module.css}`

**Interfaces — Consumes:** `segundaDaSemana`, `diasUteis`, `somarDias`, `diaEstaAberto` (Task 1); `quantidadeSugerida`, `nomeDaLinha` (Task 2); `salvarPedido`, `apagarPedido`, `repetirSemanaAnterior`, `pedidosDoPeriodo`, `listarClientes`, `cardapioDaSemana` (Task 3); `Folha`, `Aviso` (Task 4). **Produces:** `salvarPedidoAcao(dados)`, `apagarPedidoAcao(clienteId, data)`, `repetirSemanaAcao(segunda)` → `{ ok: true; criados: number } | { ok: false; erro }`.

- [ ] **Step 1: Testes que falham** (`validacao.test.ts`): `quantidade` 0 e 4 recusadas; `opcao: 'X'` recusada; `data` em sábado → "Escolha um dia de segunda a sexta."
- [ ] **Step 2: Rodar, implementar, passar.**
- [ ] **Step 3: Tela igual ao esboço Pedidos:** "Pedidos · 09 a 13/11", setas (`?semana=`), busca, grade 96 px + 5 colunas. Célula: vazia "–" (tracejado), opção (verde), V (verde-claro), com marmitão (laranja-texto, "PD+M"), quantidade 2+ mostra "2". Abaixo do nome, o plano.
- [ ] **Step 4: Folha da célula:** título "Edu · sexta 13/11"; 6 botões de opção com `nomeDaLinha` (título + detalhe) e "Sem pedido"; quantidade − / + começando em `quantidadeSugerida` (ou no valor salvo); "Marmitão" começando em `marmitaoPadrao`; "Anotação"; "Salvar". Depois do corte: aviso "Os pedidos deste dia já fecharam. Você ainda pode mudar."
- [ ] **Step 5: Legenda** do esboço e "Repetir semana passada" com confirmação ("Copiar os pedidos da semana passada para os dias vazios?") e resultado ("12 pedidos copiados." / "Nada para copiar.").
- [ ] **Step 6: Verificar** — `npm test && npm run build` → PASS. Commit — `Add weekly orders grid`

---

### Task 7: Hoje e Entregas

**Files:** `src/app/(painel)/hoje/{page.tsx,hoje.module.css}`, `src/app/(painel)/entregas/{page.tsx,CardParada.tsx,acoes.ts,entregas.module.css}`

**Interfaces — Consumes:** `hojeSP`, `minutosAteCorte`, `diaDaSemana` (Task 1); `contarProducao`, `contarPorLeva`, `nomeDaLinha`, `textoResumoLeva`, `listaDeEntregas` (Task 2); `pedidosDoDia`, `cardapioDoDia`, `listarClientes({ incluirInativos: true })`, `definirEntregue` (Task 3). **Produces:** `definirEntregueAcao(pedidoId: number, entregue: boolean)`.

- [ ] **Step 1: Hoje** igual ao esboço Main (spec §2): cabeçalho com logo, data ("Hoje, quarta 11/11"), linha do corte ("faltam 1h20" / "Pedidos fechados" / "Sem entregas hoje"); "O que cozinhar" só com opções > 0; "Total · N marmitas"; caixa de marmitões (nomes); bloco "Por leva" com `textoResumoLeva`. Sem pedidos: "Nenhum pedido para hoje."
- [ ] **Step 2: Entregas** igual ao esboço: abas de leva (`?leva=`, padrão: primeira leva com entrega pendente), "X de Y entregues", cards com número, nome, endereço, `resumo`, anotações em laranja-escuro, "Abrir mapa" → `https://www.google.com/maps/search/?api=1&query=<endereço>, Itapetininga - SP` (nova aba), "Entregue" ↔ "Entregue ✓" (card esmaecido). Atualização otimista com `useOptimistic`; a ação recebe o estado desejado. Leva vazia: "Nenhuma entrega nesta leva."
- [ ] **Step 3: Verificar** — `npm test && npm run build` → PASS; `npm run db:semear -- --limpar && npm run dev`, abrir as duas telas em 390 px e comparar com os esboços.
- [ ] **Step 4: Commit** — `Add today and delivery screens`

---

### Task 8: Testes de ponta a ponta, capturas e UX

**Files:** `playwright.config.ts`, `tests/e2e/fluxo.spec.ts`, `tests/e2e/capturas.spec.ts`

- [ ] **Step 1: Configurar** — `npm i -D @playwright/test && npx playwright install chromium`. `webServer`: `npm run db:semear -- --limpar && npm run dev` com `APP_PIN=1234`. Projetos `celular-360` (360×800) e `celular-390` (390×844).
- [ ] **Step 2: Fluxo** (390): PIN errado → mensagem; PIN certo → `/hoje` com "O que cozinhar"; `/pedidos` → célula vazia → "Prato do dia" → "Salvar" → célula "PD"; `/hoje` total sobe 1; `/entregas` → "Entregue" → "Entregue ✓" e "1 de N entregues"; recarregar a página mantém "Entregue ✓".
- [ ] **Step 3: Capturas** de todas as telas (inclusive a folha aberta) em 360 e 390, em `test-results/capturas/`. Checar que não há rolagem horizontal (`scrollWidth <= innerWidth`).
- [ ] **Step 4: Rodar** — `npx playwright test` → PASS.
- [ ] **Step 5: Olhar cada captura** e comparar com os esboços. Corrigir layout, cor, tamanho e texto. Rodar de novo.
- [ ] **Step 6: Revisão de UX** com `anthropic-skills:web-design-guidelines` sobre `src/app` e `src/ui`. Corrigir. Rodar `npm test && npm run build && npx playwright test`.
- [ ] **Step 7: Commit** — `Add end-to-end tests and UX fixes`

---

### Task 9: README, publicação, revisão e Brain 2

**Files:** `README.md` (inglês STE), `.env.example`; Brain 2: `D:\JF\Projetos\Painel Bella Si\Painel Bella Si.md`, `Decisões - Painel Bella Si.md`, `D:\JF\00 Painel.md`

- [ ] **Step 1: README:** what it is, local setup (`npm i`, `npm run db:semear -- --limpar`, `npm run dev`, PIN `1234`), env vars (`DATABASE_URL`, `AUTH_SECRET`, `APP_PIN`), tests, deploy, "Not in this version" (spec §10).
- [ ] **Step 2: Revisão final** (`superpowers:requesting-code-review`, revisor novo no modelo mais capaz) sobre todos os commits. Corrigir o que for confirmado. Rodar `npm test && npm run build && npx playwright test`.
- [ ] **Step 3: GitHub:** o João cria `Joaofelipe26/painel-bella-si` (privado, sem README). `git remote add origin https://github.com/Joaofelipe26/painel-bella-si.git && git push -u origin main`.
- [ ] **Step 4: Vercel:** projeto `painel-bella-si` no time `sinapse-labs`, ligado ao repositório. O João cria o banco Neon (Storage → Create Database → Neon → conectar ao projeto) e digita o `APP_PIN` no painel. O Claude gera o `AUTH_SECRET`.
- [ ] **Step 5: Publicar** — push no `main`; o build roda `vercel-build` (migrações + `next build`). Verificar `/entrar` no link publicado.
- [ ] **Step 6: Verificação final** (`superpowers:verification-before-completion`): testes, build e Playwright passam; link publicado abre e aceita o PIN.
- [ ] **Step 7: Brain 2:** linha no Histórico; decisões da spec §11 em `Decisões - Painel Bella Si.md`; registrar que a versão completa foi trocada pela versão leve e por quê; `repositorio` e `link_publicado` na nota central; status e próximo passo no `00 Painel.md`.
- [ ] **Step 8: Commit** — `Add README and deploy setup`

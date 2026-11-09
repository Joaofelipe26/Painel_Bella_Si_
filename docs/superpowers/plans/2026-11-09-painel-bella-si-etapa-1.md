# Painel Bella Si – Etapa 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Painel web para a Simone e o Bruno lançarem pedidos, verem a produção do dia e marcarem as entregas da marmitaria Bella Si.

**Architecture:** Next.js App Router. Regras do negócio em funções puras (`src/dominio/`), testadas primeiro. Leitura em Server Components e gravação em Server Actions, que chamam consultas Drizzle (`src/db/consultas/`) que recebem o `db` como parâmetro. PGlite no computador e nos testes; Neon na Vercel.

**Tech Stack:** Next.js (última estável) + React + TypeScript, Drizzle ORM + drizzle-kit, `@electric-sql/pglite`, `@neondatabase/serverless`, `jose`, `bcryptjs`, `zod`, Vitest, Playwright, CSS Modules + variáveis CSS.

**Spec:** `docs/superpowers/specs/2026-11-09-painel-bella-si-etapa-1-design.md`

## Global Constraints

- Fuso: `America/Sao_Paulo` em todas as datas. Datas trafegam como texto `YYYY-MM-DD`. Use `Intl.DateTimeFormat`; sem biblioteca de datas.
- Opções: `PD`, `VEG`, `BASIC_C`, `BASIC_F`, `BASIC_O`, `BASIC_T`. Siglas: PD, V, Basic C, Basic F, Basic O, Basic T; marmitão "M"; "Veg" na produção.
- Planos: `P01` (meta 6), `P02` (meta 5), `AVULSO` (sem meta). Quantidade por pedido: 1 a 3.
- Padrões de configuração: `horario_corte` 09:00; `hora_leva_1` 11:00; `hora_leva_2` 11:40; `hora_leva_3` 12:20.
- Textos da interface em português do Brasil, copiados dos esboços quando existirem.
- Letra do corpo 18 px, mínimo 16 px. Botões principais 56 px de altura; células da grade 44 px. Contraste mínimo 4.5:1.
- Componentes usam só tokens de `src/ui/tokens.css`. Nenhuma cor solta fora desse arquivo.
- Fontes por `next/font/google` (Nunito 400/600/800, Dancing Script 700). Nenhum `<link>` para o Google.
- Efeitos de mouse só dentro de `@media (hover: hover)`. Foco visível em todos os controles.
- Server Actions devolvem `{ ok: true } | { ok: false; erro: string }`, com validação Zod e erro em português simples.
- Sem valores em R$ em relatórios. A taxa do bairro é só registro.
- Commits: assunto em inglês STE, imperativo, até 50 caracteres; autor `Felipe <felipejoaoalmeida26@gmail.com>`; rodapé `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Noite em UTC:** às 22h30 em São Paulo já é o dia seguinte em UTC. "Hoje" e o corte devem usar o dia de São Paulo. Teste em Task 1.
2. **Semana que cruza o mês:** a semana de 30/11 a 04/12 divide os pedidos entre novembro e dezembro no total do mês. Teste em Task 4.
3. **Toque duplo:** confirmar o mesmo card duas vezes não pode duplicar pedidos nem falhar. Teste em Task 5.
4. **Cliente desativado:** some da grade e de "Repetir semana passada", mas os pedidos já feitos continuam em Hoje, Entregas e Mês. Testes em Tasks 3 e 5.
5. **Ordem da rota empatada ou vazia:** dois clientes com a mesma ordem na mesma leva devem sair em ordem estável (ordem, depois nome). Teste em Task 2.

---

## File Structure

```
src/dominio/tipos.ts          tipos e constantes (opções, siglas, metas)
src/dominio/datas.ts          dia de SP, semana, dia da semana, corte
src/dominio/producao.ts       contarProducao, contarProducaoPorLeva
src/dominio/semana.ts         quantidadeSugerida, conferirMetaSemanal, copiarSemanaAnterior
src/dominio/relatorios.ts     totalDoMes, listaDeEntregas
src/dominio/*.test.ts         testes ao lado
src/db/schema.ts              tabelas Drizzle
src/db/cliente.ts             criarDb(), getDb() (PGlite ou Neon)
src/db/migrar.ts              aplica migrações (script)
src/db/semear.ts              dados iniciais e de demonstração (script)
src/db/consultas/*.ts         consultas por assunto; recebem db
src/db/teste.ts               criarDbDeTeste() para Vitest
src/auth/sessao.ts            criar/ler/apagar sessão (jose)
src/auth/login.ts             verificarSenha
src/middleware.ts             proteção de rotas
src/ui/tokens.css             tokens
src/ui/*.tsx + *.module.css   componentes
src/ui/contraste.test.ts      contraste dos pares de tokens
src/app/layout.tsx            fontes, tokens
src/app/login/                tela de login
src/app/(painel)/layout.tsx   menu inferior
src/app/(painel)/<tela>/      page.tsx + acoes.ts por tela
src/app/producao/             tela do tablet (sem menu inferior)
src/app/api/webhook/whatsapp/route.ts
tests/e2e/*.spec.ts           Playwright
drizzle/                      migrações geradas
```

---

### Task 1: Base do projeto e regras de data

**Files:**
- Create: projeto Next.js na raiz, `vitest.config.ts`, `src/dominio/tipos.ts`, `src/dominio/datas.ts`, `src/dominio/datas.test.ts`, `.gitignore`, `.env.example`

**Interfaces:**
- Produces (`tipos.ts`):
  ```ts
  export type Opcao = 'PD'|'VEG'|'BASIC_C'|'BASIC_F'|'BASIC_O'|'BASIC_T';
  export type Plano = 'P01'|'P02'|'AVULSO';
  export type Leva = 1|2|3;
  export const OPCOES: readonly Opcao[];            // nessa ordem
  export const SIGLA: Record<Opcao,string>;          // PD, V, Basic C...
  export const SIGLA_PRODUCAO: Record<Opcao,string>; // PD, Veg, Basic C...
  export const NOME_BASICO: Record<'BASIC_C'|'BASIC_F'|'BASIC_O'|'BASIC_T', string>; // "Patinho moído", "Filé de frango grelhado", "Omelete de legumes", "Filé de tilápia grelhado"
  export const META_SEMANAL: Record<Plano, number|null>; // P01:6, P02:5, AVULSO:null
  export interface Pedido { id?: number; clienteId: number; data: string; opcao: Opcao; quantidade: number; marmitao: boolean; anotacao: string|null; prontoEm?: Date|null; entregueEm?: Date|null }
  export interface Cliente { id: number; nome: string; telefone: string|null; endereco: string; bairroId: number|null; leva: Leva; ordemRota: number; plano: Plano; marmitaoPadrao: boolean; anotacaoFixa: string|null; ativo: boolean }
  ```
- Produces (`datas.ts`):
  `hojeSP(agora: Date): string`, `minutosDoDiaSP(agora: Date): number`, `diaDaSemana(data: string): number` (0 = domingo), `segundaDaSemana(data: string): string`, `diasUteis(segunda: string): string[]` (5 datas), `somarDias(data: string, n: number): string`, `diaEstaAberto(data: string, agora: Date, horarioCorte: string): boolean`, `minutosAteCorte(data: string, agora: Date, horarioCorte: string): number | null`.

- [ ] **Step 1: Criar o projeto**

Run: `npx create-next-app@latest . --ts --app --src-dir --eslint --no-tailwind --import-alias "@/*" --use-npm` (aceite a pasta não vazia; mantenha `docs/`). Depois: `npm i -D vitest` e crie `vitest.config.ts` com alias `@` → `src` e `include: ['src/**/*.test.ts']`. Adicione os scripts `"test": "vitest run"`. Adicione `.pglite/`, `test-results/`, `playwright-report/` e `.env*.local` ao `.gitignore`.

- [ ] **Step 2: Escrever os testes que falham** em `src/dominio/datas.test.ts`

```ts
it('hojeSP usa o dia de São Paulo à noite', () => {
  expect(hojeSP(new Date('2026-11-12T01:30:00Z'))).toBe('2026-11-11');
});
it('segundaDaSemana', () => {
  expect(segundaDaSemana('2026-11-13')).toBe('2026-11-09');
  expect(segundaDaSemana('2026-11-15')).toBe('2026-11-09'); // domingo pertence à semana que acabou
});
it('diasUteis', () => {
  expect(diasUteis('2026-11-30')).toEqual(['2026-11-30','2026-12-01','2026-12-02','2026-12-03','2026-12-04']);
});
it('diaEstaAberto antes e depois do corte', () => {
  expect(diaEstaAberto('2026-11-11', new Date('2026-11-11T11:59:00Z'), '09:00')).toBe(true);  // 08:59 SP
  expect(diaEstaAberto('2026-11-11', new Date('2026-11-11T12:00:00Z'), '09:00')).toBe(false); // 09:00 SP
  expect(diaEstaAberto('2026-11-12', new Date('2026-11-11T15:00:00Z'), '09:00')).toBe(true);  // dia futuro
  expect(diaEstaAberto('2026-11-10', new Date('2026-11-11T10:00:00Z'), '09:00')).toBe(false); // dia passado
  expect(diaEstaAberto('2026-11-14', new Date('2026-11-13T10:00:00Z'), '09:00')).toBe(false); // sábado
});
it('minutosAteCorte', () => {
  expect(minutosAteCorte('2026-11-11', new Date('2026-11-11T10:40:00Z'), '09:00')).toBe(80); // 07:40 SP → "faltam 1h20"
  expect(minutosAteCorte('2026-11-11', new Date('2026-11-11T12:10:00Z'), '09:00')).toBeNull();
});
```

- [ ] **Step 3: Rodar e ver falhar** — Run: `npx vitest run src/dominio/datas.test.ts` — Expected: FAIL (módulo não existe).
- [ ] **Step 4: Implementar `tipos.ts` e `datas.ts`.** Aritmética de data em UTC ao meio-dia (`new Date(data + 'T12:00:00Z')`) para não errar o dia.
- [ ] **Step 5: Rodar e ver passar** — Run: `npm test` — Expected: PASS.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "Add project base and date rules"`

---

### Task 2: Contagem da produção

**Files:** Create `src/dominio/producao.ts`, `src/dominio/producao.test.ts`

**Interfaces:**
- Consumes: `Pedido`, `Cliente`, `Opcao`, `Leva`, `OPCOES` (Task 1).
- Produces:
  ```ts
  export interface ResumoProducao { porOpcao: Record<Opcao, number>; total: number; marmitoes: { clienteId: number; quantidade: number }[] }
  export function contarProducao(pedidos: Pedido[]): ResumoProducao;
  export interface PedidoNaLeva { pedido: Pedido; cliente: Cliente }
  export interface ProducaoDaLeva { leva: Leva; resumo: ResumoProducao; pedidos: PedidoNaLeva[] }
  export function contarProducaoPorLeva(pedidos: Pedido[], clientes: Cliente[]): ProducaoDaLeva[]; // sempre 3 itens, leva 1..3
  export function ordenarPorRota<T extends { cliente: Cliente }>(itens: T[]): T[]; // ordemRota, depois nome (localeCompare 'pt-BR')
  ```

- [ ] **Step 1: Testes que falham**

```ts
const p = (clienteId, opcao, quantidade = 1, marmitao = false) => ({ clienteId, data: '2026-11-11', opcao, quantidade, marmitao, anotacao: null });
it('soma quantidades por opção e total', () => {
  const r = contarProducao([p(1,'PD'), p(2,'PD',2), p(3,'VEG'), p(4,'BASIC_T',1,true)]);
  expect(r.porOpcao.PD).toBe(3); expect(r.porOpcao.VEG).toBe(1); expect(r.porOpcao.BASIC_C).toBe(0);
  expect(r.total).toBe(5);
  expect(r.marmitoes).toEqual([{ clienteId: 4, quantidade: 1 }]);
});
it('lista vazia dá zeros', () => { expect(contarProducao([]).total).toBe(0); });
it('separa por leva e ordena pela rota', () => {
  // clientes: A leva 1 ordem 2; B leva 1 ordem 1; C leva 3 ordem 1
  const r = contarProducaoPorLeva([p(A,'PD'), p(B,'VEG'), p(C,'PD',2)], [A,B,C]);
  expect(r.map(l => l.leva)).toEqual([1,2,3]);
  expect(r[0].pedidos.map(x => x.cliente.nome)).toEqual(['B','A']);
  expect(r[1].resumo.total).toBe(0);
  expect(r[2].resumo.porOpcao.PD).toBe(2);
});
it('ordem empatada usa o nome', () => {
  // Carla e Ana, ambas leva 1 e ordemRota 0
  expect(contarProducaoPorLeva([p(CARLA,'PD'), p(ANA,'PD')], [CARLA, ANA])[0].pedidos.map(x => x.cliente.nome)).toEqual(['Ana','Carla']);
});
it('pedido de cliente que não está na lista é ignorado na leva', () => { /* não lança erro */ });
```

- [ ] **Step 2: Rodar e ver falhar** — `npx vitest run src/dominio/producao.test.ts` — FAIL.
- [ ] **Step 3: Implementar `producao.ts`.**
- [ ] **Step 4: Rodar e ver passar** — PASS.
- [ ] **Step 5: Commit** — `"Add production count rules"`

---

### Task 3: Regras da semana

**Files:** Create `src/dominio/semana.ts`, `src/dominio/semana.test.ts`

**Interfaces:**
- Consumes: `Pedido`, `Cliente`, `Plano`, `META_SEMANAL`, `diaDaSemana`, `somarDias` (Task 1).
- Produces:
  ```ts
  export function quantidadeSugerida(plano: Plano, data: string): number;
  export interface Meta { total: number; meta: number|null; diferenca: number } // diferenca = total - meta; 0 se meta null
  export function conferirMetaSemanal(plano: Plano, pedidosDaSemana: Pedido[]): Meta;
  export function copiarSemanaAnterior(anteriores: Pedido[], atuais: Pedido[], clientes: Cliente[]): Pedido[]; // novos pedidos, data + 7 dias, sem id/prontoEm/entregueEm
  ```

- [ ] **Step 1: Testes que falham**

```ts
it('Plano 01 sugere 2 na sexta', () => {
  expect(quantidadeSugerida('P01', '2026-11-13')).toBe(2);
  expect(quantidadeSugerida('P01', '2026-11-12')).toBe(1);
  expect(quantidadeSugerida('P02', '2026-11-13')).toBe(1);
  expect(quantidadeSugerida('AVULSO', '2026-11-13')).toBe(1);
});
it('meta do Plano 01 fecha com 4 dias de 1 e sexta com 2', () => {
  expect(conferirMetaSemanal('P01', [1,1,1,1,2].map(q => ped(q)))).toEqual({ total: 6, meta: 6, diferenca: 0 });
});
it('meta do Plano 02 incompleta', () => {
  expect(conferirMetaSemanal('P02', [ped(1), ped(1)])).toEqual({ total: 2, meta: 5, diferenca: -3 });
});
it('avulso sem meta', () => { expect(conferirMetaSemanal('AVULSO', [ped(1)])).toEqual({ total: 1, meta: null, diferenca: 0 }); });
it('copia só dias vazios, com data + 7', () => {
  // anterior: cliente 1 seg 09 PD, ter 10 VEG; atual: cliente 1 ter 17 BASIC_F
  const novos = copiarSemanaAnterior(ant, atu, [cliente1Ativo]);
  expect(novos).toEqual([expect.objectContaining({ clienteId: 1, data: '2026-11-16', opcao: 'PD' })]);
});
it('não copia cliente desativado', () => { /* cliente 2 ativo:false → nada copiado */ });
it('copia quantidade, marmitão e anotação', () => { /* sexta Plano 01 com 2 → 2 */ });
```

- [ ] **Step 2: Rodar e ver falhar** — FAIL.
- [ ] **Step 3: Implementar `semana.ts`.**
- [ ] **Step 4: Rodar e ver passar** — PASS.
- [ ] **Step 5: Commit** — `"Add weekly plan rules"`

---

### Task 4: Total do mês e lista de entregas

**Files:** Create `src/dominio/relatorios.ts`, `src/dominio/relatorios.test.ts`

**Interfaces:**
- Consumes: `Pedido`, `Cliente`, `Leva`, `ordenarPorRota` (Task 2), `SIGLA` (Task 1).
- Produces:
  ```ts
  export interface LinhaDoMes { clienteId: number; marmitas: number; marmitoes: number; diasComEntrega: number }
  export function totalDoMes(pedidos: Pedido[], mes: string /* 'YYYY-MM' */): LinhaDoMes[]; // só clientes com pedido no mês; ordem por clienteId
  export interface Parada { numero: number; cliente: Cliente; pedido: Pedido; resumo: string; anotacoes: string[]; entregue: boolean }
  export function listaDeEntregas(pedidos: Pedido[], clientes: Cliente[], leva: Leva): Parada[];
  export function resumoDoPedido(p: Pedido, nomes: { pd: string|null; veg: string|null }): string;
  ```
- `resumoDoPedido` textos exatos: `"1 prato do dia"`, `"2 pratos do dia"`, `"1 vegetariano"`, `"1 basiquinho patinho"` / `frango` / `omelete` / `tilápia`; com marmitão: `"1 marmitão prato do dia"`. (O parâmetro `nomes` fica para a Entregas mostrar o nome do prato no futuro; nesta etapa use só o tipo.)

- [ ] **Step 1: Testes que falham**

```ts
it('conta marmitas, marmitões e dias', () => {
  // cliente 1: 02/11 PD q1; 03/11 PD q1 marmitão; 06/11 PD q2
  expect(totalDoMes(peds, '2026-11')).toEqual([{ clienteId: 1, marmitas: 4, marmitoes: 1, diasComEntrega: 3 }]);
});
it('semana que cruza o mês divide os dias', () => {
  // cliente 1: 30/11, 01/12, 02/12, 03/12, 04/12 (1 cada)
  expect(totalDoMes(peds, '2026-11')[0].marmitas).toBe(1);
  expect(totalDoMes(peds, '2026-12')[0].marmitas).toBe(4);
});
it('marmitão conta pela quantidade do pedido', () => { /* q2 marmitão → marmitoes 2 */ });
it('lista de entregas da leva na ordem da rota, numerada a partir de 1', () => {
  const l = listaDeEntregas(peds, clientes, 1);
  expect(l.map(x => [x.numero, x.cliente.nome])).toEqual([[1,'Fernando'],[2,'Edu']]);
});
it('junta anotação fixa e anotação do pedido', () => {
  expect(parada.anotacoes).toEqual(['3 sacolas', 'sem feijão']);
});
it('entregue vem de entregueEm', () => { /* entregueEm Date → true */ });
it('resumoDoPedido', () => { expect(resumoDoPedido({ ...p, opcao: 'PD', quantidade: 1, marmitao: true }, nomes)).toBe('1 marmitão prato do dia'); });
```

- [ ] **Step 2–4:** falhar, implementar, passar.
- [ ] **Step 5: Commit** — `"Add month total and delivery list"`

---

### Task 5: Banco de dados, consultas e dados iniciais

**Files:**
- Create: `drizzle.config.ts`, `src/db/schema.ts`, `src/db/cliente.ts`, `src/db/migrar.ts`, `src/db/semear.ts`, `src/db/teste.ts`, `src/db/consultas/{clientes,bairros,cardapio,pedidos,pendentes,levas,configuracoes,usuarios}.ts`, `src/db/consultas/*.test.ts`

**Interfaces:**
- Consumes: tipos (Task 1), `copiarSemanaAnterior` (Task 3).
- Produces:
  - `schema.ts`: tabelas da spec §6 com nomes em snake_case no banco e camelCase no TS. `pedidos` com `unique(cliente_id, data)`; `pedidos.data` e `cardapio_dia.data` do tipo `date` em modo `string`; `pedidos_pendentes.itens` `jsonb` tipado como `ItemPendente[]` (`{ data: string; opcao: Opcao; quantidade: number; marmitao: boolean; anotacao: string|null }`).
  - `cliente.ts`: `type Db`; `criarDb(url?: string): Promise<Db>` (com `url` → Neon http; sem `url` → PGlite em `.pglite/`, migrações aplicadas na criação); `getDb(): Promise<Db>` (singleton, usa `process.env.DATABASE_URL`).
  - `teste.ts`: `criarDbDeTeste(): Promise<Db>` (PGlite em memória + migrações).
  - Consultas (todas recebem `db` como 1º parâmetro):
    - `clientes.ts`: `listarClientes(db, { incluirInativos?: boolean })`, `obterCliente(db, id)`, `salvarCliente(db, dados)` (cria ou atualiza), `desativarCliente(db, id)`
    - `bairros.ts`: `listarBairros(db)`, `salvarBairro(db, dados)`
    - `cardapio.ts`: `cardapioDaSemana(db, segunda): Record<string, CardapioDia|null>`, `salvarCardapioDia(db, dia)`
    - `pedidos.ts`: `pedidosDoDia(db, data)`, `pedidosDoPeriodo(db, inicio, fim)`, `salvarPedido(db, p)` (upsert por cliente+data), `apagarPedido(db, clienteId, data)`, `marcarEntregue(db, id, entregue: boolean)`, `marcarPronto(db, id, pronto: boolean)`, `repetirSemanaAnterior(db, segunda): Promise<number>` (quantos criou)
    - `pendentes.ts`: `listarPendentes(db)`, `contarPendentes(db)`, `confirmarPendente(db, id)` (grava itens com `origem='bot'`, marca `confirmado`; se já confirmado, não faz nada e devolve `{ ok: true }`; sem cliente → `{ ok: false, erro: 'Escolha o cliente antes de confirmar.' }`), `marcarPendenteConfirmado(db, id)`, `descartarPendente(db, id)`
    - `levas.ts`: `marcarLevaPronta(db, data, leva)`, `levasProntas(db, data): Leva[]`
    - `configuracoes.ts`: `lerConfiguracoes(db): Promise<{ horarioCorte: string; horaLeva: Record<Leva,string> }>` (com padrões da Global Constraints quando falta), `salvarConfiguracoes(db, c)`
    - `usuarios.ts`: `obterUsuarioPorPapel(db, papel)`
  - `semear.ts`: `semear(db, { demo: boolean, senhas: { simone: string; bruno: string } })`. Sempre: 2 usuários (hash bcrypt), configurações padrão. Com `demo`: 4 bairros de exemplo, os clientes dos esboços (Michel, Edu, Alexandra, J. Marcos, Fernando, Maria Isabel, Ana, Sr. Jorge, Dona Lurdes, Carla, Rita, Paulo) com endereços dos esboços, cardápio da semana atual e 3 pendentes dos esboços (J. Marcos, Alexandra, Michel com aviso “"sem feijão" virou anotação. Está certo?”). Script CLI: `npm run db:semear` (lê `SENHA_SIMONE`, `SENHA_BRUNO`; flags `--demo` e `--limpar`, que apaga `.pglite/` antes e só funciona sem `DATABASE_URL`). Rodar duas vezes não duplica (upsert por nome/papel).
  - Scripts: `"db:gerar": "drizzle-kit generate"`, `"db:migrar": "tsx src/db/migrar.ts"`, `"db:semear": "tsx src/db/semear.ts"`, `"vercel-build": "tsx src/db/migrar.ts && next build"`.

- [ ] **Step 1: Instalar** — `npm i drizzle-orm @electric-sql/pglite @neondatabase/serverless bcryptjs zod && npm i -D drizzle-kit tsx @types/bcryptjs`
- [ ] **Step 2: Escrever `schema.ts`, gerar a migração** — Run: `npm run db:gerar` — Expected: arquivo SQL novo em `drizzle/`.
- [ ] **Step 3: Testes que falham** (`src/db/consultas/*.test.ts`, cada um com `criarDbDeTeste()`):

```ts
it('salvarPedido substitui o pedido do mesmo cliente e dia', async () => {
  await salvarPedido(db, { clienteId: 1, data: '2026-11-11', opcao: 'PD', quantidade: 1, marmitao: false, anotacao: null });
  await salvarPedido(db, { clienteId: 1, data: '2026-11-11', opcao: 'VEG', quantidade: 1, marmitao: false, anotacao: null });
  const r = await pedidosDoDia(db, '2026-11-11');
  expect(r).toHaveLength(1); expect(r[0].opcao).toBe('VEG');
});
it('confirmarPendente duas vezes não duplica', async () => {
  await confirmarPendente(db, id); const r = await confirmarPendente(db, id);
  expect(r).toEqual({ ok: true });
  expect(await pedidosDoPeriodo(db, '2026-11-09', '2026-11-13')).toHaveLength(2);
  expect(await contarPendentes(db)).toBe(0);
});
it('confirmarPendente sem cliente devolve erro', async () => { /* erro: 'Escolha o cliente antes de confirmar.' */ });
it('cliente desativado continua com os pedidos do dia', async () => { /* desativarCliente → pedidosDoDia ainda tem o pedido; listarClientes() sem ele */ });
it('repetirSemanaAnterior só preenche dias vazios e devolve quantos criou', async () => { /* 3 anteriores, 1 já existe → 2 */ });
it('lerConfiguracoes usa padrões quando vazio', async () => {
  expect(await lerConfiguracoes(db)).toEqual({ horarioCorte: '09:00', horaLeva: { 1: '11:00', 2: '11:40', 3: '12:20' } });
});
it('semear com demo cria 2 usuários e 3 pendentes', async () => { /* ... */ });
```

- [ ] **Step 4: Rodar e ver falhar** — `npx vitest run src/db` — FAIL.
- [ ] **Step 5: Implementar `cliente.ts`, `teste.ts`, consultas, `migrar.ts`, `semear.ts`.**
- [ ] **Step 6: Rodar e ver passar** — `npm test` — PASS.
- [ ] **Step 7: Commit** — `"Add database schema and queries"`

---

### Task 6: Design system

**Files:** Create `src/ui/tokens.css`, `src/ui/contraste.ts`, `src/ui/contraste.test.ts`, `src/ui/{Botao,Card,Cabecalho,MenuInferior,Folha,Aviso,Logo}.tsx` + `.module.css`; Modify `src/app/layout.tsx`, `src/app/globals.css`

**Interfaces:**
- Produces:
  - Tokens da spec §9, mais `--fonte-texto`, `--fonte-logo`, `--texto-16..28`, `--espaco-1..6` (4–24 px), `--raio-p/m/g/xg` (10/12/16/20), `--altura-botao: 56px`, `--altura-celula: 44px`.
  - `export function razaoDeContraste(corA: string, corB: string): number` (fórmula WCAG).
  - `<Botao variante="principal"|"contorno"|"laranja"|"claro" tamanho?="normal"|"grande" {...button}>`, `<Card destaque?="feito"|"aviso">`, `<Cabecalho titulo subtitulo? logo?>`, `<MenuInferior ativo="hoje"|"pedidos"|"entregas"|"mais">`, `<Folha aberta aoFechar titulo>` (folha de baixo com `role="dialog"`, `aria-modal`, foco preso, Esc fecha), `<Aviso tipo="info"|"erro"|"ok">`, `<Logo tamanho>`.
- [ ] **Step 1: Teste que falha** — `contraste.test.ts`: para cada par usado em texto, `razaoDeContraste >= 4.5`: texto/creme, texto-suave/creme, branco/verde, branco/laranja-texto, texto/laranja, #7A3410/laranja-claro, verde-escuro/verde-claro, verde/branco. Run → FAIL.
- [ ] **Step 2: Implementar `contraste.ts`; rodar.** Se um par der menos de 4.5, escureça o token (não mude o par) e anote a troca no commit.
- [ ] **Step 3: Implementar tokens, fontes (`next/font/google`, variáveis `--fonte-texto` e `--fonte-logo`) e componentes.** `globals.css`: `body` com fundo creme, 18 px, `:focus-visible` com contorno de 3 px verde.
- [ ] **Step 4: Verificar** — `npm test && npm run build` — PASS.
- [ ] **Step 5: Commit** — `"Add design tokens and base components"`

---

### Task 7: Login e proteção de rotas

**Files:** Create `src/auth/sessao.ts`, `src/auth/login.ts`, `src/auth/sessao.test.ts`, `src/middleware.ts`, `src/app/login/page.tsx`, `src/app/login/acoes.ts`, `src/app/(painel)/layout.tsx`, `src/app/(painel)/mais/page.tsx`

**Interfaces:**
- Consumes: `obterUsuarioPorPapel` (Task 5), componentes (Task 6).
- Produces: `type Papel = 'simone'|'bruno'`; `criarToken(papel): Promise<string>`, `lerToken(token): Promise<{ papel: Papel } | null>`, `lerSessao(): Promise<{ papel: Papel } | null>` (cookie `sessao`), `exigirSessao(): Promise<{ papel: Papel }>` (redireciona para `/login`), `entrar(formData)` Server Action, `sair()` Server Action. `AUTH_SECRET` obrigatório em produção; no computador usa um valor de desenvolvimento fixo com aviso no console.

- [ ] **Step 1: Teste que falha** — `criarToken('bruno')` → `lerToken` devolve `{ papel: 'bruno' }`; token alterado → `null`; token vencido (31 dias) → `null`.
- [ ] **Step 2: Rodar, implementar, passar.**
- [ ] **Step 3: Tela `/login`:** logo, título "Quem está entrando?", 2 botões grandes "Simone" e "Bruno" (rádio visual), campo "Senha" (`autocomplete="current-password"`), botão "Entrar". Erro: "Senha errada. Tente de novo." Depois do login: Simone → `/hoje`, Bruno → `/entregas`.
- [ ] **Step 4: `middleware.ts`:** sem cookie válido → `/login`, exceto `/login`, `/api/webhook/whatsapp`, `/_next`, arquivos estáticos. `/` redireciona conforme o papel.
- [ ] **Step 5: `(painel)/layout.tsx`** com `MenuInferior`; `/mais` com links grandes: Clientes, Bairros, Cardápio, Mês, Linha de produção, Configurações, Sair.
- [ ] **Step 6: Verificar** — `npm test && npm run build` — PASS. Commit — `"Add login for Simone and Bruno"`

---

### Task 8: Tela Hoje

**Files:** Create `src/app/(painel)/hoje/page.tsx`, `hoje.module.css`

**Interfaces:**
- Consumes: `hojeSP`, `minutosAteCorte`, `diaEstaAberto` (Task 1), `contarProducao` (Task 2), `pedidosDoDia`, `cardapioDaSemana`, `contarPendentes`, `lerConfiguracoes`, `listarClientes({ incluirInativos: true })` (Task 5).

- [ ] **Step 1: Implementar a tela igual ao esboço Main:** cabeçalho verde com Logo, "Hoje, quarta 11/11", "Pedidos fecham às 9h · faltam 1h20" (ou "Pedidos fechados" depois do corte; fim de semana: "Sem entregas hoje"). Faixa laranja "N pedidos para conferir" → `/chegando` (só se N > 0). "O que cozinhar": uma linha por opção com quantidade > 0; nome da linha "Prato do dia", "Vegetariano", "Basiquinho patinho/frango/omelete/tilápia"; texto de baixo: nome do prato do cardápio (PD/VEG) ou `NOME_BASICO`. Linha "Total · N marmitas". Caixa laranja-clara "**N marmitões** hoje: nomes".
- [ ] **Step 2: Verificar** — `npm run build` — PASS; `npm run dev` com `npm run db:semear -- --demo`, abrir `/hoje` em 390 px e comparar com o esboço.
- [ ] **Step 3: Commit** — `"Add today screen"`

---

### Task 9: Pedidos da semana

**Files:** Create `src/app/(painel)/pedidos/page.tsx`, `GradeSemana.tsx` (client), `FolhaPedido.tsx` (client), `acoes.ts`, `pedidos.module.css`

**Interfaces:**
- Consumes: `segundaDaSemana`, `diasUteis`, `somarDias` (Task 1), `quantidadeSugerida`, `conferirMetaSemanal` (Task 3), `salvarPedido`, `apagarPedido`, `repetirSemanaAnterior`, `pedidosDoPeriodo`, `listarClientes`, `cardapioDaSemana` (Task 5), `Folha`, `Aviso` (Task 6).
- Produces (Server Actions em `acoes.ts`): `salvarPedidoAcao(dados)`, `apagarPedidoAcao(clienteId, data)`, `repetirSemanaAcao(segunda)` → `{ ok: true, criados: number } | { ok: false, erro }`.

- [ ] **Step 1: Teste da validação (Vitest)** — o schema Zod de `salvarPedidoAcao` recusa `quantidade: 0`, `quantidade: 4`, `opcao: 'X'`, `data` em sábado (erro "Escolha um dia de segunda a sexta."). Rodar → FAIL; implementar; PASS.
- [ ] **Step 2: Tela igual ao esboço Pedidos:** "Pedidos · 09 a 13/11" com setas de semana anterior/seguinte (`?semana=YYYY-MM-DD`), busca por nome (filtro no cliente), grade de 96 px + 5 colunas. Célula: vazia "–" (tracejado), opção (verde), V (verde-claro), com marmitão (laranja-texto, "PD+M"), quantidade > 1 mostra "2". Abaixo do nome: plano; se a meta não fecha, "Plano 01 · 4 de 6" em laranja-texto.
- [ ] **Step 3: Folha da célula:** título "Edu · sexta 13/11"; botões grandes para as 6 opções (com nome do prato do cardápio) e "Sem pedido"; quantidade com − / + (começa em `quantidadeSugerida`); interruptor "Marmitão" (começa com `marmitaoPadrao`); campo "Anotação"; botão "Salvar". Depois do corte: aviso "Pedidos deste dia já fecharam. Você ainda pode mudar." sem bloquear.
- [ ] **Step 4: Legenda** igual ao esboço e botão "Repetir semana passada" com confirmação ("Copiar os pedidos da semana passada para os dias vazios?") e resultado ("12 pedidos copiados.").
- [ ] **Step 5: Verificar** — `npm test && npm run build` — PASS. Commit — `"Add weekly orders grid"`

---

### Task 10: Entregas

**Files:** Create `src/app/(painel)/entregas/page.tsx`, `CardParada.tsx` (client), `acoes.ts`, `entregas.module.css`

**Interfaces:**
- Consumes: `listaDeEntregas`, `resumoDoPedido` (Task 4), `pedidosDoDia`, `marcarEntregue`, `listarClientes({ incluirInativos: true })` (Task 5).
- Produces: `marcarEntregueAcao(pedidoId: number, entregue: boolean)`.

- [ ] **Step 1: Tela igual ao esboço Entregas:** "Entregas de hoje", abas "1ª leva / 2ª leva / 3ª leva" (`?leva=1`, padrão: primeira leva com entrega pendente), "X de Y entregues". Card: número, nome, endereço, resumo, anotações em laranja-escuro; "Abrir mapa" → `https://www.google.com/maps/search/?api=1&query=<endereço, Itapetininga - SP>` (nova aba); "Entregue" (verde) ↔ "Entregue ✓" (verde-claro, card esmaecido). Atualização otimista com `useOptimistic`. Leva sem pedidos: "Nenhuma entrega nesta leva."
- [ ] **Step 2: Verificar** — `npm run build` — PASS. Commit — `"Add delivery screen for Bruno"`

---

### Task 11: Pedidos chegando, novo pedido e webhook

**Files:** Create `src/app/(painel)/chegando/page.tsx`, `CardPendente.tsx` (client), `acoes.ts`, `src/app/(painel)/chegando/novo/page.tsx`, `FormNovoPedido.tsx` (client), `src/app/api/webhook/whatsapp/route.ts`, `src/app/api/webhook/whatsapp/route.test.ts`

**Interfaces:**
- Consumes: `listarPendentes`, `confirmarPendente`, `marcarPendenteConfirmado`, `salvarPedido`, `listarClientes`, `quantidadeSugerida` (Tasks 3, 5).
- Produces: `confirmarPendenteAcao(id)`, `salvarNovoPedidoAcao(dados: { clienteId; dias: string[]; opcao; quantidade; marmitao; anotacao; pendenteId?: number })`.

- [ ] **Step 1: Teste do webhook que falha** — `GET` e `POST` devolvem status 501 e corpo `{ erro: 'Bot ainda não ligado' }`. Rodar → FAIL; implementar; PASS. Comentário no topo do `route.ts` com o que a etapa do bot fará (spec §10).
- [ ] **Step 2: Tela igual ao esboço Chegando:** "Pedidos chegando", "N pedidos para conferir · lidos do WhatsApp", cards com nome, hora (`HH:mm`), mensagem entre aspas, itens ("**Qua 11** · 1 Basic C"), endereço · leva, aviso "Confira:" com borda laranja, botões "Corrigir" (→ `/chegando/novo?pendente=<id>`) e "Confirmar". Card sem cliente: só "Corrigir". Estado vazio "Tudo conferido!" / "Os pedidos já estão na produção." Botão fixo laranja-texto "+ Novo pedido (áudio ou ligação)" → `/chegando/novo`.
- [ ] **Step 3: Tela Novo pedido:** um passo por bloco: cliente (busca + lista), dias da semana atual (botões de seleção múltipla), opção, quantidade, marmitão, anotação, "Salvar pedido". Com `pendente=<id>`: campos preenchidos pelo card; ao salvar, `marcarPendenteConfirmado`. Sucesso → volta para `/chegando` com aviso "Pedido salvo."
- [ ] **Step 4: Verificar** — `npm test && npm run build` — PASS. Commit — `"Add incoming orders and manual entry"`

---

### Task 12: Linha de produção (tablet)

**Files:** Create `src/app/producao/page.tsx`, `ColunaLeva.tsx` (client), `acoes.ts`, `producao.module.css`

**Interfaces:**
- Consumes: `contarProducaoPorLeva`, `ordenarPorRota` (Task 2), `pedidosDoDia`, `marcarPronto`, `marcarLevaPronta`, `levasProntas`, `contarPendentes`, `lerConfiguracoes` (Task 5), `exigirSessao` (Task 7).
- Produces: `marcarProntoAcao(pedidoId, pronto)`, `marcarLevaProntaAcao(leva)`.

- [ ] **Step 1: Tela igual ao esboço Producao (1180×820):** cabeçalho com Logo, "Quarta 11/11 · 34 marmitas", "Pedidos fecham 9h", selo laranja "N novos pedidos para conferir" (→ `/chegando`), botão "Voltar" (→ `/hoje`). 3 colunas: "1ª leva", "sai 11h00", chips de resumo ("6 PD", "2 Veg", "1 Marmitão"), linhas de pedido (nome + prato + anotação; marmitão em laranja-claro); toque risca (pronto). Botão "Leva pronta → Bruno"; depois do toque: "Leva pronta ✓". Atualiza sozinha a cada 60 s (`router.refresh`). Em retrato ou celular, as colunas empilham.
- [ ] **Step 2: Verificar** — `npm run build` — PASS. Commit — `"Add kitchen production screen"`

---

### Task 13: Cadastros e configurações

**Files:** Create `src/app/(painel)/{clientes,clientes/[id],clientes/novo,bairros,cardapio,configuracoes}/page.tsx` + `acoes.ts` + formulários client

**Interfaces:**
- Consumes: consultas de clientes, bairros, cardápio e configurações (Task 5); `diasUteis`, `segundaDaSemana` (Task 1); `NOME_BASICO` (Task 1).

- [ ] **Step 1: Teste da validação (Vitest)** — schema Zod de cliente: nome e endereço obrigatórios ("Digite o nome.", "Digite o endereço."); leva 1–3; ordem ≥ 0. Schema de configurações: horários no formato `HH:mm`. Rodar → FAIL; implementar; PASS.
- [ ] **Step 2: Clientes:** busca, lista (nome, plano, leva, bairro), botão "+ Novo cliente"; formulário com todos os campos da spec §6 e botão "Desativar cliente" (com confirmação). Inativos em uma seção recolhida "Clientes desativados" com "Reativar".
- [ ] **Step 3: Bairros:** lista e formulário (nome, taxa em reais, guardada em centavos).
- [ ] **Step 4: Cardápio:** seletor de semana; para cada dia, 4 campos (Prato do dia, descrição, Vegetariano, descrição) e "Salvar semana". Caixa só de leitura com os 4 basiquinhos.
- [ ] **Step 5: Configurações:** horário de corte e horário das 3 levas (`<input type="time">`).
- [ ] **Step 6: Verificar** — `npm test && npm run build` — PASS. Commit — `"Add customers, menu and settings screens"`

---

### Task 14: Mês

**Files:** Create `src/app/(painel)/mes/page.tsx`, `mes.module.css`

**Interfaces:** Consumes `totalDoMes` (Task 4), `pedidosDoPeriodo`, `listarClientes({ incluirInativos: true })` (Task 5).

- [ ] **Step 1: Tela:** "Mês · novembro de 2026" com setas (`?mes=YYYY-MM`); aviso "Só quantidades. Sem valores."; tabela com cabeçalho (Cliente, Marmitas, Marmitões, Dias) e linha final "Total". Em 360 px, a tabela vira cards (nome em cima, 3 números embaixo). Mês sem pedidos: "Nenhum pedido neste mês."
- [ ] **Step 2: Verificar** — `npm run build` — PASS. Commit — `"Add monthly count screen"`

---

### Task 15: Testes de ponta a ponta, capturas e revisão de UX

**Files:** Create `playwright.config.ts`, `tests/e2e/fluxo.spec.ts`, `tests/e2e/capturas.spec.ts`

- [ ] **Step 1: Configurar** — `npm i -D @playwright/test && npx playwright install chromium`. `webServer`: `npm run db:semear -- --demo --limpar && npm run dev` com `SENHA_SIMONE=teste` e `SENHA_BRUNO=teste` (o `--limpar` apaga `.pglite/` antes). Projetos: `celular-360` (360×800), `celular-390` (390×844), `tablet` (1180×820).
- [ ] **Step 2: Fluxo** (`fluxo.spec.ts`, projeto 390): login Simone → `/hoje` mostra "O que cozinhar"; `/pedidos` → tocar célula vazia, escolher "Prato do dia", salvar → célula mostra "PD"; `/chegando` → "Confirmar" no card de J. Marcos → card some; sair; login Bruno → `/entregas` → "Entregue" → "Entregue ✓" e "1 de N entregues".
- [ ] **Step 3: Capturas** (`capturas.spec.ts`): todas as telas em 360 e 390; `/producao` no tablet. Salvar em `test-results/capturas/`. Verificar também: nenhuma rolagem horizontal (`document.documentElement.scrollWidth <= innerWidth`).
- [ ] **Step 4: Rodar** — `npx playwright test` — PASS.
- [ ] **Step 5: Olhar cada captura e comparar com o esboço.** Corrigir diferenças de layout, cor, tamanho e texto. Rodar de novo.
- [ ] **Step 6: Revisão de UX** com a skill `anthropic-skills:web-design-guidelines` sobre `src/app` e `src/ui`. Corrigir os itens de acessibilidade. Rodar `npm test && npm run build && npx playwright test`.
- [ ] **Step 7: Commit** — `"Add end-to-end tests and UX fixes"`

---

### Task 16: README, publicação e Brain 2

**Files:** Create `README.md` (inglês STE), Modify `.env.example`; Brain 2: `D:\JF\Projetos\Painel Bella Si\Painel Bella Si.md`, `Decisões - Painel Bella Si.md`, `D:\JF\00 Painel.md`

- [ ] **Step 1: README:** what it is, local setup (`npm i`, `npm run db:semear -- --demo`, `npm run dev`), env vars (`DATABASE_URL`, `AUTH_SECRET`, `SENHA_SIMONE`, `SENHA_BRUNO`), tests, deploy, WhatsApp webhook plan (spec §10).
- [ ] **Step 2: Repositório no GitHub** `Joaofelipe26/painel-bella-si` (privado). Sem `gh`: o João cria pelo site (github.com/new, sem README) ou aprova a instalação do `gh`. Depois: `git remote add origin ... && git push -u origin main`.
- [ ] **Step 3: Vercel:** projeto `painel-bella-si` no time `sinapse-labs`, ligado ao repositório. O João cria o banco Neon (Storage → Create Database → Neon → conectar ao projeto). Definir `AUTH_SECRET` (gerado), `SENHA_SIMONE`, `SENHA_BRUNO` (o João escolhe e digita no painel da Vercel).
- [ ] **Step 4: Publicar e semear** — push no `main`; build roda `vercel-build`. Rodar `npm run db:semear` uma vez com a `DATABASE_URL` de produção (sem `--demo`). Verificar o login no link publicado.
- [ ] **Step 5: Verificação final** (skill `superpowers:verification-before-completion`): `npm test`, `npm run build`, `npx playwright test` passam; link publicado abre `/login`.
- [ ] **Step 6: Revisão final** (skill `superpowers:requesting-code-review`, revisor novo no modelo mais capaz) sobre a branch inteira. Corrigir o que for confirmado.
- [ ] **Step 7: Brain 2:** linha no Histórico da nota central; decisões da spec §14 em `Decisões - Painel Bella Si.md` (formato `### AAAA-MM-DD: Título` + **Decisão:** + **Motivo:**); campos `repositorio` e `link_publicado`; status e próximo passo no `00 Painel.md`.
- [ ] **Step 8: Commit** — `"Add README and deploy setup"`

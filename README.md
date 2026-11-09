# Painel Bella Si

Order and delivery panel for **Bella Si Cozinha Saudável**, a healthy lunch-box kitchen in Itapetininga (SP).

Simone marks each customer's orders for the week in a grid. The app counts what to cook today, in total and per delivery round ("leva"). Bruno sees the deliveries of each round on his phone and marks each delivery.

Version: Stage 1, light version (4 screens).

## Screens

| Route | Screen | Use |
|---|---|---|
| `/entrar` | Sign in | Type the PIN. |
| `/hoje` | Today | What to cook, total, large boxes ("marmitões"), summary per round. |
| `/pedidos` | Weekly orders | Grid customer × Monday–Friday. Tap a cell to set the order. "Repeat last week" button. |
| `/entregas` | Deliveries | Stops of each round in route order. "Open map" and "Delivered". |
| `/cadastros` | Records | Customers and weekly menu. Sign out. |

## Stack

- Next.js 16 (App Router) + TypeScript
- Postgres with Drizzle ORM
  - Production: Neon (through Vercel).
  - Local and tests: PGlite (Postgres in the Node process, folder `.pglite/`). No install needed.
- Business rules in `src/dominio/` (pure functions, tested first).
- Design tokens in `src/ui/tokens.css`. Components use tokens only.

## Run on your computer

1. Install the packages:
   ```bash
   npm install
   ```
2. Create demo data (this deletes `.pglite/` first):
   ```bash
   npm run db:semear -- --limpar
   ```
3. Start the app:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 and type the PIN `1234` (local default).

## Environment variables

| Name | Where | Value |
|---|---|---|
| `DATABASE_URL` | Production | Neon connection string. The Vercel–Neon integration sets it. Leave empty on your computer. |
| `AUTH_SECRET` | Production | Long random text. It signs the login cookie. Required in production. |
| `APP_PIN` | Production | PIN for Simone and Bruno. Required in production. |

See `.env.example`.

## Tests

```bash
npm test
```

Unit tests (Vitest): business rules, database queries on in-memory PGlite, validation, color contrast, session.

```bash
npm run test:e2e
```

End-to-end tests (Playwright) at 360 px and 390 px. They start their own server on port 3007 with fresh demo data and save screenshots to `test-results/capturas/`. To use a server that already runs, set `PW_BASE_URL` (for example `PW_BASE_URL=http://localhost:3005`).

Note: stop any other `next dev` in this folder first. Next.js allows one dev server per folder, and PGlite allows one process per database folder.

## Deploy

- Vercel project `painel-bella-si`, team `sinapse-labs`. A push to `main` deploys.
- The `vercel-build` script applies the database migrations (`src/db/migrar.ts`) and then runs `next build`.
- The production database starts empty. Simone adds customers in **Cadastros**. The demo data script refuses to run when `DATABASE_URL` is set.

## Database changes

1. Edit `src/db/schema.ts`.
2. Generate the migration:
   ```bash
   npm run db:gerar
   ```
3. Commit the new file in `drizzle/`. The next deploy applies it.

## Not in this version

- Incoming orders from WhatsApp (bot cards), the `pedidos_pendentes` table and the webhook.
- Kitchen screen for the tablet.
- Monthly report.
- Settings screen (the order cut-off is 9:00, in `src/dominio/tipos.ts`).
- Separate accounts for Simone and Bruno.
- Neighborhood table with delivery fee.
- Customer link (Stage 2).

Design spec and plan: `docs/superpowers/`.

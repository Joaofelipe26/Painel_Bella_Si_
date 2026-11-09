/**
 * Aplica as migrações no banco de produção (Neon).
 * Roda no build da Vercel (script vercel-build). Sem DATABASE_URL, não faz nada:
 * o PGlite do computador aplica as migrações sozinho ao abrir.
 */
import path from 'node:path';

async function principal(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log('Sem DATABASE_URL: nada a migrar.');
    return;
  }
  const { neon } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-http');
  const { migrate } = await import('drizzle-orm/neon-http/migrator');
  await migrate(drizzle(neon(url)), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  console.log('Migrações aplicadas.');
}

principal().catch((erro) => {
  console.error(erro);
  process.exit(1);
});

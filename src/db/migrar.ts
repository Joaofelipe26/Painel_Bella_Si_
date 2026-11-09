/**
 * Aplica as migrações no banco de produção (Neon).
 * Roda no build da Vercel (script vercel-build), só no ambiente de produção:
 * um preview não pode mudar o banco de produção antes do merge.
 * Sem DATABASE_URL, não faz nada: o PGlite do computador aplica as migrações sozinho.
 */
import path from 'node:path';

export function deveMigrar(env: Record<string, string | undefined>): boolean {
  if (!env.DATABASE_URL) return false;
  if (env.VERCEL_ENV && env.VERCEL_ENV !== 'production') return false;
  return true;
}

async function principal(): Promise<void> {
  if (!deveMigrar(process.env)) {
    console.log('Migração pulada (sem DATABASE_URL ou fora da produção).');
    return;
  }
  const { neon } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-http');
  const { migrate } = await import('drizzle-orm/neon-http/migrator');
  await migrate(drizzle(neon(process.env.DATABASE_URL!)), { migrationsFolder: path.join(process.cwd(), 'drizzle') });
  console.log('Migrações aplicadas.');
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('src/db/migrar.ts')) {
  principal().catch((erro) => {
    console.error(erro);
    process.exit(1);
  });
}

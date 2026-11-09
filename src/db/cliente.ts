import path from 'node:path';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const PASTA_MIGRACOES = path.join(process.cwd(), 'drizzle');

/**
 * Com `url`: Neon (produção).
 * Sem `url`: PGlite na pasta indicada, ou em memória quando `pasta` é null.
 */
export async function criarDb(url?: string, pasta: string | null = '.pglite'): Promise<Db> {
  if (url) {
    const { neon } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-http');
    return drizzle(neon(url), { schema }) as unknown as Db;
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  const db = drizzle(pasta ? new PGlite(pasta) : new PGlite(), { schema });
  await migrate(db, { migrationsFolder: PASTA_MIGRACOES });
  return db as unknown as Db;
}

const global = globalThis as unknown as { __dbBellaSi?: Promise<Db> };

export function getDb(): Promise<Db> {
  global.__dbBellaSi ??= criarDb(process.env.DATABASE_URL || undefined);
  return global.__dbBellaSi;
}

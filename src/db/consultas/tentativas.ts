import { eq, sql } from 'drizzle-orm';
import type { Tentativas } from '@/auth/sessao';
import type { Db } from '../cliente';
import { tentativasPin } from '../schema';

const LINHA = 1;

export async function lerTentativas(db: Db): Promise<Tentativas> {
  const [linha] = await db.select().from(tentativasPin).where(eq(tentativasPin.id, LINHA));
  return linha ? { erros: linha.erros, ultimoErro: linha.ultimoErro } : { erros: 0, ultimoErro: 0 };
}

/** Soma um erro em uma só instrução, para pedidos simultâneos não perderem a conta. */
export async function registrarErro(db: Db, agora: number): Promise<void> {
  await db
    .insert(tentativasPin)
    .values({ id: LINHA, erros: 1, ultimoErro: agora })
    .onConflictDoUpdate({
      target: tentativasPin.id,
      set: { erros: sql`${tentativasPin.erros} + 1`, ultimoErro: agora },
    });
}

export async function limparTentativas(db: Db): Promise<void> {
  await db.delete(tentativasPin).where(eq(tentativasPin.id, LINHA));
}

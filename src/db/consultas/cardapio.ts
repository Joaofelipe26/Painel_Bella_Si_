import { and, eq, gte, lte } from 'drizzle-orm';
import { diasUteis } from '@/dominio/datas';
import type { CardapioDia } from '@/dominio/tipos';
import type { Db } from '../cliente';
import { cardapioDia } from '../schema';

export async function cardapioDoDia(db: Db, data: string): Promise<CardapioDia | null> {
  const [linha] = await db.select().from(cardapioDia).where(eq(cardapioDia.data, data));
  return linha ?? null;
}

export async function cardapioDaSemana(db: Db, segunda: string): Promise<Record<string, CardapioDia | null>> {
  const dias = diasUteis(segunda);
  const linhas = await db
    .select()
    .from(cardapioDia)
    .where(and(gte(cardapioDia.data, dias[0]), lte(cardapioDia.data, dias[4])));
  const porData = new Map(linhas.map((l) => [l.data, l]));
  return Object.fromEntries(dias.map((d) => [d, porData.get(d) ?? null]));
}

export async function salvarCardapio(db: Db, dias: CardapioDia[]): Promise<void> {
  for (const dia of dias) {
    const { data, ...campos } = dia;
    await db.insert(cardapioDia).values(dia).onConflictDoUpdate({ target: cardapioDia.data, set: campos });
  }
}

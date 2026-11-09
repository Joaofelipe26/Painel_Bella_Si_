import { and, asc, eq, gte, lte } from 'drizzle-orm';
import { somarDias } from '@/dominio/datas';
import { copiarSemanaAnterior } from '@/dominio/semana';
import type { Pedido } from '@/dominio/tipos';
import type { Db } from '../cliente';
import { pedidos } from '../schema';
import { listarClientes } from './clientes';

export async function pedidosDoDia(db: Db, data: string): Promise<Pedido[]> {
  return db.select().from(pedidos).where(eq(pedidos.data, data)).orderBy(asc(pedidos.id));
}

export async function pedidosDoPeriodo(db: Db, inicio: string, fim: string): Promise<Pedido[]> {
  return db
    .select()
    .from(pedidos)
    .where(and(gte(pedidos.data, inicio), lte(pedidos.data, fim)))
    .orderBy(asc(pedidos.data), asc(pedidos.clienteId));
}

/** Cria ou substitui o pedido do cliente no dia. A marca de entrega fica como está. */
export async function salvarPedido(db: Db, p: Pedido): Promise<void> {
  const campos = {
    opcao: p.opcao,
    quantidade: p.quantidade,
    marmitao: p.marmitao,
    anotacao: p.anotacao,
  };
  await db
    .insert(pedidos)
    .values({ clienteId: p.clienteId, data: p.data, ...campos })
    .onConflictDoUpdate({ target: [pedidos.clienteId, pedidos.data], set: campos });
}

export async function apagarPedido(db: Db, clienteId: number, data: string): Promise<void> {
  await db.delete(pedidos).where(and(eq(pedidos.clienteId, clienteId), eq(pedidos.data, data)));
}

/** Recebe o estado desejado, para dois toques seguidos não trocarem o resultado. */
export async function definirEntregue(db: Db, pedidoId: number, entregue: boolean): Promise<void> {
  const atual = await db.select({ entregueEm: pedidos.entregueEm }).from(pedidos).where(eq(pedidos.id, pedidoId));
  if (!atual[0]) return;
  if (entregue && atual[0].entregueEm) return;
  await db
    .update(pedidos)
    .set({ entregueEm: entregue ? new Date() : null })
    .where(eq(pedidos.id, pedidoId));
}

/** Copia a semana anterior para os dias vazios da semana que começa em `segunda`. Devolve quantos criou. */
export async function repetirSemanaAnterior(db: Db, segunda: string, agora: Date = new Date()): Promise<number> {
  const anteriores = await pedidosDoPeriodo(db, somarDias(segunda, -7), somarDias(segunda, -3));
  const atuais = await pedidosDoPeriodo(db, segunda, somarDias(segunda, 4));
  const clientes = await listarClientes(db);
  const novos = copiarSemanaAnterior(anteriores, atuais, clientes, agora);
  if (novos.length === 0) return 0;
  const criados = await db.insert(pedidos).values(novos).onConflictDoNothing().returning({ id: pedidos.id });
  return criados.length;
}

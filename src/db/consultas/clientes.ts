import { and, asc, eq, gt } from 'drizzle-orm';
import { hojeSP } from '@/dominio/datas';
import type { Cliente } from '@/dominio/tipos';
import type { Db } from '../cliente';
import { clientes, pedidos } from '../schema';

export async function listarClientes(db: Db, opcoes: { incluirInativos?: boolean } = {}): Promise<Cliente[]> {
  const consulta = db.select().from(clientes);
  const linhas = opcoes.incluirInativos
    ? await consulta.orderBy(asc(clientes.nome))
    : await consulta.where(eq(clientes.ativo, true)).orderBy(asc(clientes.nome));
  return linhas.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function salvarCliente(db: Db, dados: Omit<Cliente, 'id'> & { id?: number }): Promise<Cliente> {
  const { id, ...campos } = dados;
  if (id) {
    const [linha] = await db.update(clientes).set(campos).where(eq(clientes.id, id)).returning();
    return linha;
  }
  const [linha] = await db.insert(clientes).values(campos).returning();
  return linha;
}

/** Ao desativar, apaga os pedidos depois de `hoje`. Os de hoje e os passados ficam (entrega e histórico). */
export async function definirAtivo(db: Db, id: number, ativo: boolean, hoje: string = hojeSP(new Date())): Promise<void> {
  await db.update(clientes).set({ ativo }).where(eq(clientes.id, id));
  if (!ativo) {
    await db.delete(pedidos).where(and(eq(pedidos.clienteId, id), gt(pedidos.data, hoje)));
  }
}

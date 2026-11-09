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

function chaveDoNome(nome: string): string {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** Cria clientes de uma planilha. Pula nomes que já existem (ativos ou não) ou que se repetem na lista. */
export async function importarClientes(
  db: Db,
  lista: Omit<Cliente, 'id' | 'ativo'>[],
): Promise<{ criados: number; ignorados: string[] }> {
  const existentes = new Set((await listarClientes(db, { incluirInativos: true })).map((c) => chaveDoNome(c.nome)));
  const novos: Omit<Cliente, 'id'>[] = [];
  const ignorados: string[] = [];
  for (const c of lista) {
    const chave = chaveDoNome(c.nome);
    if (existentes.has(chave)) {
      ignorados.push(c.nome);
      continue;
    }
    existentes.add(chave);
    novos.push({ ...c, ativo: true });
  }
  if (novos.length > 0) await db.insert(clientes).values(novos);
  return { criados: novos.length, ignorados };
}

/** Ao desativar, apaga os pedidos depois de `hoje`. Os de hoje e os passados ficam (entrega e histórico). */
export async function definirAtivo(db: Db, id: number, ativo: boolean, hoje: string = hojeSP(new Date())): Promise<void> {
  await db.update(clientes).set({ ativo }).where(eq(clientes.id, id));
  if (!ativo) {
    await db.delete(pedidos).where(and(eq(pedidos.clienteId, id), gt(pedidos.data, hoje)));
  }
}

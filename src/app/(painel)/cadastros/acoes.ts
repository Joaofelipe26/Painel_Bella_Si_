'use server';

import { revalidatePath } from 'next/cache';
import { ERRO_SESSAO, sessaoAtiva } from '@/auth/exigirSessao';
import { getDb } from '@/db/cliente';
import { salvarCardapio } from '@/db/consultas/cardapio';
import { definirAtivo, importarClientes, salvarCliente } from '@/db/consultas/clientes';
import type { RespostaAcao } from '@/lib/resultado';
import { lerPlanilhaClientes } from './planilha';
import { validarCardapio, validarCliente } from './validacao';

export async function salvarClienteAcao(_anterior: RespostaAcao | null, formData: FormData): Promise<RespostaAcao> {
  if (!(await sessaoAtiva())) return ERRO_SESSAO;
  const r = validarCliente(Object.fromEntries(formData));
  if (!r.ok) return r;
  try {
    await salvarCliente(await getDb(), { ...r.valor, ativo: true });
  } catch {
    return { ok: false, erro: 'Não foi possível salvar. Tente de novo.' };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function definirAtivoAcao(id: number, ativo: boolean): Promise<RespostaAcao> {
  if (!(await sessaoAtiva())) return ERRO_SESSAO;
  try {
    await definirAtivo(await getDb(), id, ativo);
  } catch {
    return { ok: false, erro: 'Não foi possível salvar. Tente de novo.' };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function salvarCardapioAcao(_anterior: RespostaAcao | null, formData: FormData): Promise<RespostaAcao> {
  if (!(await sessaoAtiva())) return ERRO_SESSAO;
  const datas = formData.getAll('data').map(String);
  const dias = datas.map((data) => ({
    data,
    pratoDia: formData.get(`pratoDia-${data}`),
    pratoDiaDesc: formData.get(`pratoDiaDesc-${data}`),
    veg: formData.get(`veg-${data}`),
    vegDesc: formData.get(`vegDesc-${data}`),
  }));
  const r = validarCardapio(dias);
  if (!r.ok) return r;
  try {
    await salvarCardapio(await getDb(), r.valor);
  } catch {
    return { ok: false, erro: 'Não foi possível salvar. Tente de novo.' };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export type RespostaImportacao =
  | { ok: true; criados: number; ignorados: string[] }
  | { ok: false; erro: string };

/** Importa os clientes válidos de uma planilha CSV. As linhas com erro ficam de fora. */
export async function importarClientesAcao(texto: string): Promise<RespostaImportacao> {
  if (!(await sessaoAtiva())) return ERRO_SESSAO;
  if (typeof texto !== 'string' || texto.length > 500_000) return { ok: false, erro: 'Arquivo grande demais.' };
  const { clientes } = lerPlanilhaClientes(texto);
  if (clientes.length === 0) return { ok: false, erro: 'Nenhum cliente válido na planilha.' };
  try {
    const r = await importarClientes(await getDb(), clientes);
    revalidatePath('/', 'layout');
    return { ok: true, ...r };
  } catch {
    return { ok: false, erro: 'Não foi possível importar. Tente de novo.' };
  }
}

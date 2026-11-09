'use server';

import { revalidatePath } from 'next/cache';
import { getDb } from '@/db/cliente';
import { salvarCardapio } from '@/db/consultas/cardapio';
import { definirAtivo, salvarCliente } from '@/db/consultas/clientes';
import type { RespostaAcao } from '@/lib/resultado';
import { validarCardapio, validarCliente } from './validacao';

export async function salvarClienteAcao(_anterior: RespostaAcao | null, formData: FormData): Promise<RespostaAcao> {
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
  try {
    await definirAtivo(await getDb(), id, ativo);
  } catch {
    return { ok: false, erro: 'Não foi possível salvar. Tente de novo.' };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function salvarCardapioAcao(_anterior: RespostaAcao | null, formData: FormData): Promise<RespostaAcao> {
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

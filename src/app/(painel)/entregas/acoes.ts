'use server';

import { revalidatePath } from 'next/cache';
import { ERRO_SESSAO, sessaoAtiva } from '@/auth/exigirSessao';
import { getDb } from '@/db/cliente';
import { definirEntregue } from '@/db/consultas/pedidos';
import type { RespostaAcao } from '@/lib/resultado';

/** Recebe o estado desejado (não "inverter"), para dois toques seguidos não trocarem o resultado. */
export async function definirEntregueAcao(pedidoId: number, entregue: boolean): Promise<RespostaAcao> {
  if (!(await sessaoAtiva())) return ERRO_SESSAO;
  if (!Number.isInteger(pedidoId) || typeof entregue !== 'boolean') return { ok: false, erro: 'Dados inválidos.' };
  try {
    await definirEntregue(await getDb(), pedidoId, entregue);
  } catch {
    return { ok: false, erro: 'Não foi possível salvar. Tente de novo.' };
  }
  revalidatePath('/entregas');
  return { ok: true };
}

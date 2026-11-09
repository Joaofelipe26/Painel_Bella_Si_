'use server';

import { revalidatePath } from 'next/cache';
import { ERRO_SESSAO, sessaoAtiva } from '@/auth/exigirSessao';
import { getDb } from '@/db/cliente';
import { apagarPedido, repetirSemanaAnterior, salvarPedido } from '@/db/consultas/pedidos';
import { ehDiaUtil, segundaDaSemana } from '@/dominio/datas';
import type { RespostaAcao } from '@/lib/resultado';
import { validarPedido } from './validacao';

const ERRO_SALVAR = 'Não foi possível salvar. Tente de novo.';

export async function salvarPedidoAcao(dados: unknown): Promise<RespostaAcao> {
  if (!(await sessaoAtiva())) return ERRO_SESSAO;
  const r = validarPedido(dados);
  if (!r.ok) return r;
  try {
    await salvarPedido(await getDb(), r.valor);
  } catch {
    return { ok: false, erro: ERRO_SALVAR };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function apagarPedidoAcao(clienteId: number, data: string): Promise<RespostaAcao> {
  if (!(await sessaoAtiva())) return ERRO_SESSAO;
  if (!Number.isInteger(clienteId) || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return { ok: false, erro: 'Dados inválidos.' };
  try {
    await apagarPedido(await getDb(), clienteId, data);
  } catch {
    return { ok: false, erro: ERRO_SALVAR };
  }
  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function repetirSemanaAcao(segunda: string): Promise<{ ok: true; criados: number } | { ok: false; erro: string }> {
  if (!(await sessaoAtiva())) return ERRO_SESSAO;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(segunda) || !ehDiaUtil(segunda) || segundaDaSemana(segunda) !== segunda) {
    return { ok: false, erro: 'Semana inválida.' };
  }
  try {
    const criados = await repetirSemanaAnterior(await getDb(), segunda);
    revalidatePath('/', 'layout');
    return { ok: true, criados };
  } catch {
    return { ok: false, erro: ERRO_SALVAR };
  }
}

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_SESSAO, criarToken, esperaMs, pinConfere, podeTentar, VALIDADE_DIAS } from '@/auth/sessao';
import { getDb } from '@/db/cliente';
import { lerTentativas, limparTentativas, registrarErro } from '@/db/consultas/tentativas';

export interface EstadoEntrar {
  erro: string | null;
}

function textoEspera(ms: number): string {
  const minutos = Math.ceil(ms / 60_000);
  if (ms < 60_000) return `${Math.ceil(ms / 1000)} segundos`;
  return minutos === 1 ? '1 minuto' : `${minutos} minutos`;
}

/** O contador de erros fica no banco: apagar cookies não zera a conta. */
export async function entrarAcao(_anterior: EstadoEntrar, formData: FormData): Promise<EstadoEntrar> {
  const db = await getDb();
  const agora = Date.now();
  const tentativas = await lerTentativas(db);
  if (!podeTentar(tentativas, agora)) {
    const falta = esperaMs(tentativas.erros) - (agora - tentativas.ultimoErro);
    return { erro: `Muitas tentativas. Espere ${textoEspera(falta)}.` };
  }

  const pin = String(formData.get('pin') ?? '').trim();
  if (!pinConfere(pin)) {
    await registrarErro(db, agora);
    return { erro: 'PIN errado. Tente de novo.' };
  }

  await limparTentativas(db);
  (await cookies()).set(COOKIE_SESSAO, await criarToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: VALIDADE_DIAS * 86400,
    path: '/',
  });
  redirect('/hoje');
}

export async function sairAcao(): Promise<void> {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect('/entrar');
}

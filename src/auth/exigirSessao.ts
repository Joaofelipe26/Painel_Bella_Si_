import { cookies } from 'next/headers';
import { COOKIE_SESSAO, tokenValido } from './sessao';

export const ERRO_SESSAO = { ok: false as const, erro: 'Sua sessão acabou. Entre de novo.' };

/** Cada ação do servidor confere a sessão, sem depender só do proxy. */
export async function sessaoAtiva(): Promise<boolean> {
  return tokenValido((await cookies()).get(COOKIE_SESSAO)?.value);
}

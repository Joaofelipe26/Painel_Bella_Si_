'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  COOKIE_SESSAO,
  COOKIE_TENTATIVAS,
  criarToken,
  pinConfere,
  podeTentar,
  type Tentativas,
  VALIDADE_DIAS,
} from '@/auth/sessao';

export interface EstadoEntrar {
  erro: string | null;
}

function lerTentativas(valor: string | undefined): Tentativas {
  try {
    const t = JSON.parse(valor ?? '');
    if (typeof t.erros === 'number' && typeof t.ultimoErro === 'number') return t;
  } catch {}
  return { erros: 0, ultimoErro: 0 };
}

export async function entrarAcao(_anterior: EstadoEntrar, formData: FormData): Promise<EstadoEntrar> {
  const loja = await cookies();
  const tentativas = lerTentativas(loja.get(COOKIE_TENTATIVAS)?.value);
  const agora = Date.now();
  if (!podeTentar(tentativas, agora)) {
    return { erro: 'Muitas tentativas. Espere 30 segundos.' };
  }

  const pin = String(formData.get('pin') ?? '').trim();
  if (!pinConfere(pin)) {
    const erros = tentativas.erros >= 5 ? 1 : tentativas.erros + 1;
    loja.set(COOKIE_TENTATIVAS, JSON.stringify({ erros, ultimoErro: agora }), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600,
      path: '/',
    });
    return { erro: 'PIN errado. Tente de novo.' };
  }

  loja.delete(COOKIE_TENTATIVAS);
  loja.set(COOKIE_SESSAO, await criarToken(), {
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

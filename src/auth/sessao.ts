import { jwtVerify, SignJWT } from 'jose';

export const COOKIE_SESSAO = 'sessao';
export const VALIDADE_DIAS = 90;

const SEGREDO_DEV = 'segredo-so-para-o-computador-local-bella-si';
const PIN_DEV = '1234';

function segredo(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) {
    if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET não definida');
    return new TextEncoder().encode(SEGREDO_DEV);
  }
  return new TextEncoder().encode(s);
}

/** Em produção, o PIN precisa de 6 dígitos ou mais (10^6 combinações). */
export function pinServeParaProducao(pin: string): boolean {
  return /^\d{6,}$/.test(pin);
}

function pinCerto(): string {
  const pin = process.env.APP_PIN;
  if (process.env.NODE_ENV === 'production') {
    if (!pin || !pinServeParaProducao(pin)) {
      console.error('APP_PIN ausente ou curto: use 6 dígitos ou mais.');
      throw new Error('APP_PIN ausente ou com menos de 6 dígitos');
    }
    return pin;
  }
  return pin || PIN_DEV;
}

export async function criarToken(): Promise<string> {
  return new SignJWT({ ok: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${VALIDADE_DIAS}d`)
    .sign(segredo());
}

export async function tokenValido(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, segredo(), { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

/** Comparação em tempo constante. */
export function pinConfere(pin: string): boolean {
  const certo = pinCerto();
  const tamanho = Math.max(pin.length, certo.length);
  let diferenca = pin.length ^ certo.length;
  for (let i = 0; i < tamanho; i++) {
    diferenca |= (pin.charCodeAt(i) || 0) ^ (certo.charCodeAt(i) || 0);
  }
  return diferenca === 0;
}

export interface Tentativas {
  erros: number;
  ultimoErro: number;
}

/** Espera depois de N erros seguidos: 5 → 30 s, 10 → 5 min, 20 → 1 h. */
export function esperaMs(erros: number): number {
  if (erros >= 20) return 60 * 60_000;
  if (erros >= 10) return 5 * 60_000;
  if (erros >= 5) return 30_000;
  return 0;
}

export function podeTentar(t: Tentativas, agora: number): boolean {
  return agora - t.ultimoErro >= esperaMs(t.erros);
}

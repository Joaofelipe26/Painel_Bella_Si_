import { jwtVerify, SignJWT } from 'jose';

export const COOKIE_SESSAO = 'sessao';
export const COOKIE_TENTATIVAS = 'tentativas';
export const VALIDADE_DIAS = 90;
const LIMITE_ERROS = 5;
const ESPERA_MS = 30_000;

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

function pinCerto(): string {
  const pin = process.env.APP_PIN;
  if (!pin) {
    if (process.env.NODE_ENV === 'production') throw new Error('APP_PIN não definida');
    return PIN_DEV;
  }
  return pin;
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

export function podeTentar(t: Tentativas, agora: number): boolean {
  return t.erros < LIMITE_ERROS || agora - t.ultimoErro >= ESPERA_MS;
}

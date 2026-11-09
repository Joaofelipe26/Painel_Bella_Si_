import { SignJWT } from 'jose';
import { beforeAll, describe, expect, it } from 'vitest';
import { criarToken, esperaMs, pinConfere, pinServeParaProducao, podeTentar, tokenValido } from './sessao';

beforeAll(() => {
  process.env.AUTH_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres';
  process.env.APP_PIN = '1234';
});

describe('token', () => {
  it('um token novo é válido', async () => {
    expect(await tokenValido(await criarToken())).toBe(true);
  });

  it('um token alterado não é válido', async () => {
    const t = await criarToken();
    expect(await tokenValido(t.slice(0, -2) + (t.endsWith('A') ? 'BB' : 'AA'))).toBe(false);
  });

  it('um token de 91 dias não é válido', async () => {
    const chave = new TextEncoder().encode(process.env.AUTH_SECRET);
    const agora = Math.floor(Date.now() / 1000);
    const velho = await new SignJWT({ ok: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(agora - 91 * 86400)
      .setExpirationTime(agora - 86400)
      .sign(chave);
    expect(await tokenValido(velho)).toBe(false);
  });

  it('texto qualquer não é válido', async () => {
    expect(await tokenValido('abc')).toBe(false);
  });
});

describe('pinConfere', () => {
  it('aceita o PIN certo e recusa o errado', () => {
    expect(pinConfere('1234')).toBe(true);
    expect(pinConfere('1235')).toBe(false);
    expect(pinConfere('12345')).toBe(false);
    expect(pinConfere('')).toBe(false);
  });
});

describe('podeTentar', () => {
  it('com menos de 5 erros, pode tentar', () => {
    expect(podeTentar({ erros: 4, ultimoErro: 1000 }, 1001)).toBe(true);
  });
  it('com 5 erros, espera 30 segundos', () => {
    expect(podeTentar({ erros: 5, ultimoErro: 1000 }, 1000 + 29_000)).toBe(false);
    expect(podeTentar({ erros: 5, ultimoErro: 1000 }, 1000 + 31_000)).toBe(true);
  });
});

describe('esperaMs', () => {
  it('a espera cresce com os erros', () => {
    expect(esperaMs(4)).toBe(0);
    expect(esperaMs(5)).toBe(30_000);
    expect(esperaMs(10)).toBe(5 * 60_000);
    expect(esperaMs(20)).toBe(60 * 60_000);
    expect(esperaMs(500)).toBe(60 * 60_000);
  });
});

describe('pinServeParaProducao', () => {
  it('exige 6 dígitos ou mais', () => {
    expect(pinServeParaProducao('1234')).toBe(false);
    expect(pinServeParaProducao('12345a')).toBe(false);
    expect(pinServeParaProducao('482913')).toBe(true);
    expect(pinServeParaProducao('48291377')).toBe(true);
  });
});

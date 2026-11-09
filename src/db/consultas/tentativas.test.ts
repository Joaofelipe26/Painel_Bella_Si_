import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../cliente';
import { criarDbDeTeste } from '../teste';
import { lerTentativas, limparTentativas, registrarErro } from './tentativas';

let db: Db;

beforeEach(async () => {
  db = await criarDbDeTeste();
});

describe('tentativas de PIN no servidor', () => {
  it('começa sem erros', async () => {
    expect(await lerTentativas(db)).toEqual({ erros: 0, ultimoErro: 0 });
  });

  it('conta os erros no banco, sem depender do navegador', async () => {
    await registrarErro(db, 1000);
    await registrarErro(db, 2000);
    expect(await lerTentativas(db)).toEqual({ erros: 2, ultimoErro: 2000 });
  });

  it('o PIN certo zera o contador', async () => {
    await registrarErro(db, 1000);
    await limparTentativas(db);
    expect(await lerTentativas(db)).toEqual({ erros: 0, ultimoErro: 0 });
  });
});

import { describe, expect, it } from 'vitest';
import { validarCardapio, validarCliente } from './validacao';

const valido = {
  nome: 'Edu',
  telefone: '',
  endereco: 'R. Cel. Joaquim Leonel, 129',
  bairro: 'Centro',
  leva: '1',
  ordemRota: '2',
  plano: 'P01',
  marmitaoPadrao: 'on',
  anotacaoFixa: '3 sacolas',
};

describe('validarCliente', () => {
  it('aceita um cliente válido e converte os campos', () => {
    const r = validarCliente(valido);
    expect(r).toEqual({
      ok: true,
      valor: {
        nome: 'Edu',
        telefone: null,
        endereco: 'R. Cel. Joaquim Leonel, 129',
        bairro: 'Centro',
        leva: 1,
        ordemRota: 2,
        plano: 'P01',
        marmitaoPadrao: true,
        anotacaoFixa: '3 sacolas',
      },
    });
  });

  it('sem nome', () => {
    expect(validarCliente({ ...valido, nome: '  ' })).toEqual({ ok: false, erro: 'Digite o nome.' });
  });

  it('sem endereço', () => {
    expect(validarCliente({ ...valido, endereco: '' })).toEqual({ ok: false, erro: 'Digite o endereço.' });
  });

  it('leva fora de 1 a 3', () => {
    expect(validarCliente({ ...valido, leva: '4' })).toEqual({ ok: false, erro: 'Escolha a leva: 1, 2 ou 3.' });
  });

  it('ordem negativa', () => {
    expect(validarCliente({ ...valido, ordemRota: '-1' })).toEqual({ ok: false, erro: 'A ordem na rota deve ser 0 ou mais.' });
  });

  it('marmitão desmarcado', () => {
    const r = validarCliente({ ...valido, marmitaoPadrao: undefined });
    expect(r.ok && r.valor.marmitaoPadrao).toBe(false);
  });

  it('aceita id para editar', () => {
    const r = validarCliente({ ...valido, id: '7' });
    expect(r.ok && r.valor.id).toBe(7);
  });
});

describe('validarCardapio', () => {
  it('aceita a semana e troca texto vazio por null', () => {
    expect(
      validarCardapio([{ data: '2026-11-11', pratoDia: 'Almôndegas', pratoDiaDesc: '', veg: ' ', vegDesc: null }]),
    ).toEqual({
      ok: true,
      valor: [{ data: '2026-11-11', pratoDia: 'Almôndegas', pratoDiaDesc: null, veg: null, vegDesc: null }],
    });
  });

  it('recusa sábado', () => {
    expect(validarCardapio([{ data: '2026-11-14', pratoDia: 'X', pratoDiaDesc: null, veg: null, vegDesc: null }])).toEqual({
      ok: false,
      erro: 'Escolha um dia de segunda a sexta.',
    });
  });
});

import { describe, expect, it } from 'vitest';
import { validarPedido } from './validacao';

const base = { clienteId: 1, data: '2026-11-11', opcao: 'PD', quantidade: 1, marmitao: false, anotacao: '' };

describe('validarPedido', () => {
  it('aceita um pedido válido e troca anotação vazia por null', () => {
    expect(validarPedido(base)).toEqual({
      ok: true,
      valor: { clienteId: 1, data: '2026-11-11', opcao: 'PD', quantidade: 1, marmitao: false, anotacao: null },
    });
  });

  it.each([0, 4])('recusa quantidade %i', (quantidade) => {
    expect(validarPedido({ ...base, quantidade })).toEqual({ ok: false, erro: 'A quantidade vai de 1 a 3.' });
  });

  it('recusa opção desconhecida', () => {
    expect(validarPedido({ ...base, opcao: 'X' })).toEqual({ ok: false, erro: 'Escolha uma opção.' });
  });

  it('recusa o basiquinho de tilápia, que saiu do cardápio', () => {
    expect(validarPedido({ ...base, opcao: 'BASIC_T' })).toEqual({
      ok: false,
      erro: 'O basiquinho de tilápia saiu do cardápio. Na sexta, a tilápia é o prato do dia.',
    });
  });

  it('recusa sábado', () => {
    expect(validarPedido({ ...base, data: '2026-11-14' })).toEqual({
      ok: false,
      erro: 'Escolha um dia de segunda a sexta.',
    });
  });

  it('recusa sem cliente', () => {
    expect(validarPedido({ ...base, clienteId: 0 })).toEqual({ ok: false, erro: 'Escolha um cliente.' });
  });
});

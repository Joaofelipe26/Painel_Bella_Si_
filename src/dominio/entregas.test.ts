import { describe, expect, it } from 'vitest';
import { listaDeEntregas, resumoDoPedido } from './entregas';
import { cliente, pedido } from './fixtures';

const fernando = cliente(1, 'Fernando', { leva: 1, ordemRota: 1 });
const edu = cliente(2, 'Edu', { leva: 1, ordemRota: 2, anotacaoFixa: '3 sacolas' });
const michel = cliente(3, 'Michel', { leva: 2, ordemRota: 1 });

describe('listaDeEntregas', () => {
  const pedidos = [
    pedido(2, 'PD', 1, false, { id: 2, anotacao: 'sem feijão' }),
    pedido(1, 'PD', 1, false, { id: 1, entregueEm: new Date('2026-11-11T14:00:00Z') }),
    pedido(3, 'VEG', 1, false, { id: 3 }),
  ];

  it('lista a leva na ordem da rota, numerada a partir de 1', () => {
    expect(listaDeEntregas(pedidos, [fernando, edu, michel], 1).map((x) => [x.numero, x.cliente.nome])).toEqual([
      [1, 'Fernando'],
      [2, 'Edu'],
    ]);
  });

  it('junta a anotação fixa e a do pedido', () => {
    const paradaEdu = listaDeEntregas(pedidos, [fernando, edu, michel], 1)[1];
    expect(paradaEdu.anotacoes).toEqual(['3 sacolas', 'sem feijão']);
  });

  it('sem anotação dá lista vazia', () => {
    expect(listaDeEntregas(pedidos, [fernando, edu, michel], 1)[0].anotacoes).toEqual([]);
  });

  it('entregue vem de entregueEm', () => {
    const lista = listaDeEntregas(pedidos, [fernando, edu, michel], 1);
    expect(lista[0].entregue).toBe(true);
    expect(lista[1].entregue).toBe(false);
  });

  it('cliente desativado ainda aparece para entrega', () => {
    const inativo = cliente(4, 'Rita', { ativo: false });
    expect(listaDeEntregas([pedido(4, 'PD')], [inativo], 1)).toHaveLength(1);
  });

  it('traz o resumo do pedido', () => {
    expect(listaDeEntregas(pedidos, [fernando, edu, michel], 2)[0].resumo).toBe('1 vegetariano');
  });
});

describe('resumoDoPedido', () => {
  it.each([
    ['PD', 1, false, '1 prato do dia'],
    ['PD', 2, false, '2 pratos do dia'],
    ['VEG', 1, false, '1 vegetariano'],
    ['VEG', 2, false, '2 vegetarianos'],
    ['BASIC_C', 1, false, '1 basiquinho patinho'],
    ['BASIC_C', 2, false, '2 basiquinhos patinho'],
    ['BASIC_F', 1, false, '1 basiquinho frango'],
    ['BASIC_O', 1, false, '1 basiquinho omelete'],
    ['BASIC_T', 1, false, '1 basiquinho tilápia'],
    ['PD', 1, true, '1 marmitão prato do dia'],
    ['VEG', 2, true, '2 marmitões vegetariano'],
  ] as const)('%s x%i marmitão=%s → %s', (opcao, quantidade, marmitao, esperado) => {
    expect(resumoDoPedido(pedido(1, opcao, quantidade, marmitao))).toBe(esperado);
  });
});

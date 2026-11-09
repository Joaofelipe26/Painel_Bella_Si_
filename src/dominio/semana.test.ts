import { describe, expect, it } from 'vitest';
import { cliente, pedido } from './fixtures';
import { copiarSemanaAnterior, quantidadeSugerida } from './semana';

describe('quantidadeSugerida', () => {
  it('Plano 01 sugere 2 na sexta', () => {
    expect(quantidadeSugerida('P01', '2026-11-13')).toBe(2);
  });
  it('Plano 01 sugere 1 nos outros dias', () => {
    expect(quantidadeSugerida('P01', '2026-11-12')).toBe(1);
  });
  it('Plano 02 e avulso sugerem 1 na sexta', () => {
    expect(quantidadeSugerida('P02', '2026-11-13')).toBe(1);
    expect(quantidadeSugerida('AVULSO', '2026-11-13')).toBe(1);
  });
});

describe('copiarSemanaAnterior', () => {
  const c1 = cliente(1, 'Edu', { plano: 'P01' });
  // Domingo 15/11: a semana de 16 a 20/11 inteira ainda está aberta.
  const domingo = new Date('2026-11-15T15:00:00Z');

  it('copia só os dias vazios, com a data + 7', () => {
    const anteriores = [
      pedido(1, 'PD', 1, false, { id: 10, data: '2026-11-09' }),
      pedido(1, 'VEG', 1, false, { id: 11, data: '2026-11-10' }),
    ];
    const atuais = [pedido(1, 'BASIC_F', 1, false, { id: 20, data: '2026-11-17' })];
    const novos = copiarSemanaAnterior(anteriores, atuais, [c1], domingo);
    expect(novos).toEqual([
      { clienteId: 1, data: '2026-11-16', opcao: 'PD', quantidade: 1, marmitao: false, anotacao: null },
    ]);
  });

  it('não copia cliente desativado', () => {
    const inativo = cliente(2, 'Rita', { ativo: false });
    expect(copiarSemanaAnterior([pedido(2, 'PD', 1, false, { data: '2026-11-09' })], [], [inativo], domingo)).toEqual([]);
  });

  it('não copia cliente que não existe mais', () => {
    expect(copiarSemanaAnterior([pedido(9, 'PD', 1, false, { data: '2026-11-09' })], [], [c1], domingo)).toEqual([]);
  });

  it('copia quantidade, marmitão e anotação, sem a entrega', () => {
    const sexta = pedido(1, 'PD', 2, true, {
      data: '2026-11-13',
      anotacao: 'sem feijão',
      entregueEm: new Date('2026-11-13T15:00:00Z'),
    });
    expect(copiarSemanaAnterior([sexta], [], [c1], domingo)).toEqual([
      { clienteId: 1, data: '2026-11-20', opcao: 'PD', quantidade: 2, marmitao: true, anotacao: 'sem feijão' },
    ]);
  });

  it('não cria pedido para dia que já passou ou já fechou', () => {
    // Quarta 18/11 às 10h em São Paulo: seg, ter e qua já fecharam; qui e sex estão abertos.
    const quartaDez = new Date('2026-11-18T13:00:00Z');
    const anteriores = ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13'].map((data) =>
      pedido(1, 'PD', 1, false, { data }),
    );
    expect(copiarSemanaAnterior(anteriores, [], [c1], quartaDez).map((p) => p.data)).toEqual([
      '2026-11-19',
      '2026-11-20',
    ]);
  });
});

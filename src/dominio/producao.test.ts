import { describe, expect, it } from 'vitest';
import { cardapioVazio, cliente, pedido as p } from './fixtures';
import { contarPorLeva, contarProducao, nomeDaLinha, ordenarPorRota, textoResumoLeva } from './producao';

describe('contarProducao', () => {
  it('soma quantidades por opção, total e marmitões', () => {
    const r = contarProducao([p(1, 'PD'), p(2, 'PD', 2), p(3, 'VEG'), p(4, 'BASIC_T', 1, true)]);
    expect(r.porOpcao.PD).toBe(3);
    expect(r.porOpcao.VEG).toBe(1);
    expect(r.porOpcao.BASIC_C).toBe(0);
    expect(r.total).toBe(5);
    expect(r.marmitoes).toEqual([{ clienteId: 4, quantidade: 1 }]);
  });

  it('conta um pedido antigo de basiquinho de tilápia', () => {
    const r = contarProducao([p(1, 'BASIC_T'), p(2, 'PD')]);
    expect(r.porOpcao.BASIC_T).toBe(1);
    expect(r.total).toBe(2);
    expect(textoResumoLeva(r)).toBe('1 PD, 1 Basic T');
  });

  it('lista vazia dá zero', () => {
    expect(contarProducao([]).total).toBe(0);
  });
});

describe('contarPorLeva', () => {
  it('devolve sempre as 3 levas com o total de cada uma', () => {
    const a = cliente(1, 'A', { leva: 1 });
    const c = cliente(3, 'C', { leva: 3 });
    expect(contarPorLeva([p(1, 'PD'), p(3, 'PD', 2)], [a, c]).map((l) => [l.leva, l.resumo.total])).toEqual([
      [1, 1],
      [2, 0],
      [3, 2],
    ]);
  });

  it('ignora pedido de cliente desconhecido', () => {
    expect(contarPorLeva([p(99, 'PD')], []).every((l) => l.resumo.total === 0)).toBe(true);
  });
});

describe('ordenarPorRota', () => {
  it('ordena pela ordem da rota e, no empate, pelo nome', () => {
    const carla = cliente(1, 'Carla', { ordemRota: 2 });
    const ana = cliente(2, 'Ana', { ordemRota: 2 });
    const bia = cliente(3, 'Bia', { ordemRota: 1 });
    expect(ordenarPorRota([{ cliente: carla }, { cliente: ana }, { cliente: bia }]).map((x) => x.cliente.nome)).toEqual([
      'Bia',
      'Ana',
      'Carla',
    ]);
  });
});

describe('nomeDaLinha', () => {
  it('dia sem cardápio mostra só o título', () => {
    expect(nomeDaLinha('PD', null)).toEqual({ titulo: 'Prato do dia', detalhe: '' });
    expect(nomeDaLinha('VEG', cardapioVazio)).toEqual({ titulo: 'Vegetariano', detalhe: '' });
  });

  it('usa o nome do prato do cardápio', () => {
    expect(nomeDaLinha('PD', { ...cardapioVazio, pratoDia: 'Almôndegas de patinho' }).detalhe).toBe(
      'Almôndegas de patinho',
    );
    expect(nomeDaLinha('VEG', { ...cardapioVazio, veg: 'Almôndegas de lentilha' }).detalhe).toBe(
      'Almôndegas de lentilha',
    );
  });

  it('basiquinho usa o nome fixo', () => {
    expect(nomeDaLinha('BASIC_F', null)).toEqual({ titulo: 'Basiquinho frango', detalhe: 'Filé de frango grelhado' });
    expect(nomeDaLinha('BASIC_C', null).titulo).toBe('Basiquinho patinho');
    expect(nomeDaLinha('BASIC_O', null).titulo).toBe('Basiquinho omelete');
    expect(nomeDaLinha('BASIC_T', null).titulo).toBe('Basiquinho tilápia');
  });
});

describe('textoResumoLeva', () => {
  it('lista só as opções com pedido, na ordem das opções', () => {
    expect(textoResumoLeva(contarProducao([p(2, 'VEG', 2), p(1, 'PD', 6), p(3, 'BASIC_C', 3)]))).toBe(
      '6 PD, 2 Veg, 3 Basic C',
    );
  });

  it('leva vazia', () => {
    expect(textoResumoLeva(contarProducao([]))).toBe('Sem pedidos');
  });
});

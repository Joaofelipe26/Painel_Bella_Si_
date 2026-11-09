import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '../cliente';
import { criarDbDeTeste } from '../teste';
import { semear } from '../semear';
import { definirAtivo, listarClientes, salvarCliente } from './clientes';
import { cardapioDaSemana, cardapioDoDia, salvarCardapio } from './cardapio';
import {
  apagarPedido,
  definirEntregue,
  pedidosDoDia,
  pedidosDoPeriodo,
  repetirSemanaAnterior,
  salvarPedido,
} from './pedidos';

let db: Db;

const novoCliente = {
  nome: 'Edu',
  telefone: null,
  endereco: 'R. Cel. Joaquim Leonel, 129',
  bairro: 'Centro',
  leva: 1 as const,
  ordemRota: 2,
  plano: 'P01' as const,
  marmitaoPadrao: false,
  anotacaoFixa: '3 sacolas',
  ativo: true,
};

const pedidoBase = { data: '2026-11-11', opcao: 'PD' as const, quantidade: 1, marmitao: false, anotacao: null };

beforeEach(async () => {
  db = await criarDbDeTeste();
});

describe('clientes', () => {
  it('cria e atualiza um cliente', async () => {
    const c = await salvarCliente(db, novoCliente);
    expect(c.id).toBeGreaterThan(0);
    await salvarCliente(db, { ...novoCliente, id: c.id, nome: 'Eduardo' });
    expect((await listarClientes(db)).map((x) => x.nome)).toEqual(['Eduardo']);
  });

  it('cliente desativado some da lista, mas o pedido do dia continua', async () => {
    const c = await salvarCliente(db, novoCliente);
    await salvarPedido(db, { ...pedidoBase, clienteId: c.id });
    await definirAtivo(db, c.id, false);
    expect(await listarClientes(db)).toEqual([]);
    expect(await listarClientes(db, { incluirInativos: true })).toHaveLength(1);
    expect(await pedidosDoDia(db, '2026-11-11')).toHaveLength(1);
  });
});

describe('cardápio', () => {
  it('salva e lê a semana, com dia vazio como null', async () => {
    await salvarCardapio(db, [
      { data: '2026-11-11', pratoDia: 'Almôndegas de patinho', pratoDiaDesc: null, veg: 'Almôndegas de lentilha', vegDesc: null },
    ]);
    const semana = await cardapioDaSemana(db, '2026-11-09');
    expect(Object.keys(semana)).toEqual(['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13']);
    expect(semana['2026-11-09']).toBeNull();
    expect(semana['2026-11-11']?.pratoDia).toBe('Almôndegas de patinho');
    expect((await cardapioDoDia(db, '2026-11-11'))?.veg).toBe('Almôndegas de lentilha');
  });

  it('salvar de novo substitui o dia', async () => {
    const dia = { data: '2026-11-11', pratoDia: 'A', pratoDiaDesc: null, veg: null, vegDesc: null };
    await salvarCardapio(db, [dia]);
    await salvarCardapio(db, [{ ...dia, pratoDia: 'B' }]);
    expect((await cardapioDoDia(db, '2026-11-11'))?.pratoDia).toBe('B');
  });
});

describe('pedidos', () => {
  it('salvarPedido substitui o pedido do mesmo cliente e dia', async () => {
    const c = await salvarCliente(db, novoCliente);
    await salvarPedido(db, { ...pedidoBase, clienteId: c.id });
    await salvarPedido(db, { ...pedidoBase, clienteId: c.id, opcao: 'VEG' });
    const r = await pedidosDoDia(db, '2026-11-11');
    expect(r).toHaveLength(1);
    expect(r[0].opcao).toBe('VEG');
  });

  it('apagarPedido remove o pedido do dia', async () => {
    const c = await salvarCliente(db, novoCliente);
    await salvarPedido(db, { ...pedidoBase, clienteId: c.id });
    await apagarPedido(db, c.id, '2026-11-11');
    expect(await pedidosDoDia(db, '2026-11-11')).toEqual([]);
  });

  it('definirEntregue com o mesmo valor duas vezes mantém entregue; false desfaz', async () => {
    const c = await salvarCliente(db, novoCliente);
    await salvarPedido(db, { ...pedidoBase, clienteId: c.id });
    const id = (await pedidosDoDia(db, '2026-11-11'))[0].id!;
    await definirEntregue(db, id, true);
    await definirEntregue(db, id, true);
    expect((await pedidosDoDia(db, '2026-11-11'))[0].entregueEm).toBeInstanceOf(Date);
    await definirEntregue(db, id, false);
    expect((await pedidosDoDia(db, '2026-11-11'))[0].entregueEm).toBeNull();
  });

  it('salvar o pedido de novo mantém a entrega marcada', async () => {
    const c = await salvarCliente(db, novoCliente);
    await salvarPedido(db, { ...pedidoBase, clienteId: c.id });
    const id = (await pedidosDoDia(db, '2026-11-11'))[0].id!;
    await definirEntregue(db, id, true);
    await salvarPedido(db, { ...pedidoBase, clienteId: c.id, anotacao: 'sem feijão' });
    expect((await pedidosDoDia(db, '2026-11-11'))[0].entregueEm).toBeInstanceOf(Date);
  });

  it('pedidosDoPeriodo inclui o início e o fim', async () => {
    const c = await salvarCliente(db, novoCliente);
    for (const data of ['2026-11-08', '2026-11-09', '2026-11-13', '2026-11-14']) {
      await salvarPedido(db, { ...pedidoBase, clienteId: c.id, data });
    }
    expect((await pedidosDoPeriodo(db, '2026-11-09', '2026-11-13')).map((p) => p.data)).toEqual([
      '2026-11-09',
      '2026-11-13',
    ]);
  });

  it('repetirSemanaAnterior só preenche dias vazios e devolve quantos criou', async () => {
    const c = await salvarCliente(db, novoCliente);
    for (const data of ['2026-11-09', '2026-11-10', '2026-11-11']) {
      await salvarPedido(db, { ...pedidoBase, clienteId: c.id, data });
    }
    await salvarPedido(db, { ...pedidoBase, clienteId: c.id, data: '2026-11-17', opcao: 'BASIC_F' });
    expect(await repetirSemanaAnterior(db, '2026-11-16')).toBe(2);
    const semana = await pedidosDoPeriodo(db, '2026-11-16', '2026-11-20');
    expect(semana.map((p) => [p.data, p.opcao])).toEqual([
      ['2026-11-16', 'PD'],
      ['2026-11-17', 'BASIC_F'],
      ['2026-11-18', 'PD'],
    ]);
    expect(await repetirSemanaAnterior(db, '2026-11-16')).toBe(0);
  });
});

describe('semear', () => {
  it('cria os clientes de demonstração e não duplica na segunda vez', async () => {
    await semear(db, new Date('2026-11-11T10:00:00Z'));
    const n = (await listarClientes(db)).length;
    expect(n).toBeGreaterThanOrEqual(12);
    expect(await pedidosDoDia(db, '2026-11-11')).not.toHaveLength(0);
    expect((await cardapioDoDia(db, '2026-11-11'))?.pratoDia).toBeTruthy();
    await semear(db, new Date('2026-11-11T10:00:00Z'));
    expect(await listarClientes(db)).toHaveLength(n);
  });
});

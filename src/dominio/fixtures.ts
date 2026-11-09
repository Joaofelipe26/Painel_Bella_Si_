// Dados de apoio só para os testes.
import type { CardapioDia, Cliente, Leva, Opcao, Pedido } from './tipos';

export function cliente(id: number, nome: string, extra: Partial<Cliente> = {}): Cliente {
  return {
    id,
    nome,
    telefone: null,
    endereco: `Rua ${nome}, ${id}`,
    bairro: null,
    leva: 1 as Leva,
    ordemRota: 0,
    plano: 'P02',
    marmitaoPadrao: false,
    anotacaoFixa: null,
    ativo: true,
    ...extra,
  };
}

export function pedido(
  clienteId: number,
  opcao: Opcao,
  quantidade = 1,
  marmitao = false,
  extra: Partial<Pedido> = {},
): Pedido {
  return { clienteId, data: '2026-11-11', opcao, quantidade, marmitao, anotacao: null, ...extra };
}

export const cardapioVazio: CardapioDia = {
  data: '2026-11-11',
  pratoDia: null,
  pratoDiaDesc: null,
  veg: null,
  vegDesc: null,
};

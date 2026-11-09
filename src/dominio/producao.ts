import { LEVAS, NOME_BASICO, OPCOES } from './tipos';
import type { Basico, CardapioDia, Cliente, Leva, Opcao, Pedido } from './tipos';

export interface ResumoProducao {
  porOpcao: Record<Opcao, number>;
  total: number;
  marmitoes: { clienteId: number; quantidade: number }[];
}

export function contarProducao(pedidos: Pedido[]): ResumoProducao {
  const porOpcao = Object.fromEntries(OPCOES.map((o) => [o, 0])) as Record<Opcao, number>;
  const marmitoes: ResumoProducao['marmitoes'] = [];
  let total = 0;
  for (const p of pedidos) {
    porOpcao[p.opcao] += p.quantidade;
    total += p.quantidade;
    if (p.marmitao) marmitoes.push({ clienteId: p.clienteId, quantidade: p.quantidade });
  }
  return { porOpcao, total, marmitoes };
}

export function contarPorLeva(pedidos: Pedido[], clientes: Cliente[]): { leva: Leva; resumo: ResumoProducao }[] {
  const levaDe = new Map(clientes.map((c) => [c.id, c.leva]));
  return LEVAS.map((leva) => ({
    leva,
    resumo: contarProducao(pedidos.filter((p) => levaDe.get(p.clienteId) === leva)),
  }));
}

export function ordenarPorRota<T extends { cliente: Cliente }>(itens: T[]): T[] {
  return [...itens].sort(
    (a, b) => a.cliente.ordemRota - b.cliente.ordemRota || a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR'),
  );
}

const TITULO: Record<Opcao, string> = {
  PD: 'Prato do dia',
  VEG: 'Vegetariano',
  BASIC_C: 'Basiquinho patinho',
  BASIC_F: 'Basiquinho frango',
  BASIC_O: 'Basiquinho omelete',
  BASIC_T: 'Basiquinho tilápia',
};

export function nomeDaLinha(opcao: Opcao, cardapio: CardapioDia | null): { titulo: string; detalhe: string } {
  let detalhe: string;
  if (opcao === 'PD') detalhe = cardapio?.pratoDia ?? '';
  else if (opcao === 'VEG') detalhe = cardapio?.veg ?? '';
  else detalhe = NOME_BASICO[opcao as Basico];
  return { titulo: TITULO[opcao], detalhe };
}

const SIGLA_RESUMO: Record<Opcao, string> = {
  PD: 'PD',
  VEG: 'Veg',
  BASIC_C: 'Basic C',
  BASIC_F: 'Basic F',
  BASIC_O: 'Basic O',
  BASIC_T: 'Basic T',
};

export function textoResumoLeva(r: ResumoProducao): string {
  if (r.total === 0) return 'Sem pedidos';
  return OPCOES.filter((o) => r.porOpcao[o] > 0)
    .map((o) => `${r.porOpcao[o]} ${SIGLA_RESUMO[o]}`)
    .join(', ');
}

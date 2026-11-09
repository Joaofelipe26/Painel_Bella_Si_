import { ordenarPorRota } from './producao';
import type { Cliente, Leva, Opcao, Pedido } from './tipos';

export interface Parada {
  numero: number;
  cliente: Cliente;
  pedido: Pedido;
  resumo: string;
  anotacoes: string[];
  entregue: boolean;
}

export function listaDeEntregas(pedidos: Pedido[], clientes: Cliente[], leva: Leva): Parada[] {
  const porId = new Map(clientes.map((c) => [c.id, c]));
  const itens = pedidos.flatMap((pedido) => {
    const cliente = porId.get(pedido.clienteId);
    return cliente && cliente.leva === leva ? [{ cliente, pedido }] : [];
  });
  return ordenarPorRota(itens).map(({ cliente, pedido }, i) => ({
    numero: i + 1,
    cliente,
    pedido,
    resumo: resumoDoPedido(pedido),
    anotacoes: [cliente.anotacaoFixa, pedido.anotacao].filter((a): a is string => !!a && a.trim() !== ''),
    entregue: !!pedido.entregueEm,
  }));
}

const NOME: Record<Opcao, { um: string; varios: string; marmitao: string }> = {
  PD: { um: 'prato do dia', varios: 'pratos do dia', marmitao: 'prato do dia' },
  VEG: { um: 'vegetariano', varios: 'vegetarianos', marmitao: 'vegetariano' },
  BASIC_C: { um: 'basiquinho patinho', varios: 'basiquinhos patinho', marmitao: 'basiquinho patinho' },
  BASIC_F: { um: 'basiquinho frango', varios: 'basiquinhos frango', marmitao: 'basiquinho frango' },
  BASIC_O: { um: 'basiquinho omelete', varios: 'basiquinhos omelete', marmitao: 'basiquinho omelete' },
  BASIC_T: { um: 'basiquinho tilápia', varios: 'basiquinhos tilápia', marmitao: 'basiquinho tilápia' },
};

export function resumoDoPedido(p: Pedido): string {
  const n = NOME[p.opcao];
  if (p.marmitao) return `${p.quantidade} ${p.quantidade > 1 ? 'marmitões' : 'marmitão'} ${n.marmitao}`;
  return `${p.quantidade} ${p.quantidade > 1 ? n.varios : n.um}`;
}

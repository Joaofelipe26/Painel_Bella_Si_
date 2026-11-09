import { diaDaSemana, somarDias } from './datas';
import type { Cliente, Pedido, Plano } from './tipos';

const SEXTA = 5;

/** Plano 01: 6 marmitas na semana; a 6ª vai na sexta, para o sábado. */
export function quantidadeSugerida(plano: Plano, data: string): number {
  return plano === 'P01' && diaDaSemana(data) === SEXTA ? 2 : 1;
}

/** Pedidos novos para a semana atual, só nos dias vazios de clientes ativos. */
export function copiarSemanaAnterior(anteriores: Pedido[], atuais: Pedido[], clientes: Cliente[]): Pedido[] {
  const ativos = new Set(clientes.filter((c) => c.ativo).map((c) => c.id));
  const ocupados = new Set(atuais.map((p) => `${p.clienteId}|${p.data}`));
  const novos: Pedido[] = [];
  for (const p of anteriores) {
    if (!ativos.has(p.clienteId)) continue;
    const data = somarDias(p.data, 7);
    if (ocupados.has(`${p.clienteId}|${data}`)) continue;
    novos.push({
      clienteId: p.clienteId,
      data,
      opcao: p.opcao,
      quantidade: p.quantidade,
      marmitao: p.marmitao,
      anotacao: p.anotacao,
    });
  }
  return novos;
}

import type { Metadata } from 'next';
import { getDb } from '@/db/cliente';
import { cardapioDaSemana } from '@/db/consultas/cardapio';
import { listarClientes } from '@/db/consultas/clientes';
import { pedidosDoPeriodo } from '@/db/consultas/pedidos';
import { dataValida, diasUteis, hojeSP, segundaDaSemana, semanaPadrao } from '@/dominio/datas';
import { GradeSemana } from './GradeSemana';

export const metadata: Metadata = { title: 'Pedidos · Bella Si' };

export default async function PaginaPedidos({ searchParams }: PageProps<'/pedidos'>) {
  const { semana } = await searchParams;
  const segunda =
    dataValida(semana) ? segundaDaSemana(semana) : semanaPadrao(hojeSP(new Date()));
  const dias = diasUteis(segunda);
  const db = await getDb();
  const [clientes, pedidos, cardapio] = await Promise.all([
    listarClientes(db),
    pedidosDoPeriodo(db, dias[0], dias[4]),
    cardapioDaSemana(db, segunda),
  ]);

  return <GradeSemana key={segunda} segunda={segunda} clientes={clientes} pedidos={pedidos} cardapio={cardapio} />;
}

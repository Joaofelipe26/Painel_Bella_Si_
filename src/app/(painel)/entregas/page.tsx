import type { Metadata } from 'next';
import Link from 'next/link';
import { getDb } from '@/db/cliente';
import { listarClientes } from '@/db/consultas/clientes';
import { pedidosDoDia } from '@/db/consultas/pedidos';
import { hojeSP } from '@/dominio/datas';
import { levaPadrao, listaDeEntregas } from '@/dominio/entregas';
import { LEVAS, type Leva } from '@/dominio/tipos';
import { ListaParadas } from './ListaParadas';
import estilos from './entregas.module.css';

export const metadata: Metadata = { title: 'Entregas · Bella Si' };

export default async function PaginaEntregas({ searchParams }: PageProps<'/entregas'>) {
  const { leva: levaParam } = await searchParams;
  const hoje = hojeSP(new Date());
  const db = await getDb();
  const [pedidos, clientes] = await Promise.all([pedidosDoDia(db, hoje), listarClientes(db, { incluirInativos: true })]);

  const paradas = {
    1: listaDeEntregas(pedidos, clientes, 1),
    2: listaDeEntregas(pedidos, clientes, 2),
    3: listaDeEntregas(pedidos, clientes, 3),
  };
  const pedida = Number(levaParam);
  const leva: Leva =
    pedida === 1 || pedida === 2 || pedida === 3
      ? pedida
      : levaPadrao({ 1: paradas[1].map((p) => p.entregue), 2: paradas[2].map((p) => p.entregue), 3: paradas[3].map((p) => p.entregue) });

  return (
    <>
      <header className={estilos.cabecalho}>
        <h1 className={estilos.titulo}>Entregas de hoje</h1>
        <nav className={estilos.abas} aria-label="Escolha a leva">
          {LEVAS.map((l) => (
            <Link
              key={l}
              href={`/entregas?leva=${l}`}
              className={`${estilos.aba} ${l === leva ? estilos.abaAtiva : ''}`}
              aria-current={l === leva ? 'page' : undefined}
            >
              {l}ª leva
            </Link>
          ))}
        </nav>
      </header>
      <ListaParadas key={leva} paradas={paradas[leva]} />
    </>
  );
}

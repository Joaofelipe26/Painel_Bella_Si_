'use client';

import { useOptimistic, useState, useTransition } from 'react';
import type { Parada } from '@/dominio/entregas';
import { chamarAcao } from '@/lib/rede';
import { Aviso } from '@/ui/Aviso';
import { classeBotao } from '@/ui/Botao';
import { definirEntregueAcao } from './acoes';
import estilos from './entregas.module.css';

function linkMapa(endereco: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${endereco}, Itapetininga - SP`)}`;
}

export function ListaParadas({ paradas }: { paradas: Parada[] }) {
  const [entregues, marcar] = useOptimistic(
    Object.fromEntries(paradas.map((p) => [p.pedido.id!, p.entregue])) as Record<number, boolean>,
    (atual, mudanca: { id: number; entregue: boolean }) => ({ ...atual, [mudanca.id]: mudanca.entregue }),
  );
  const [, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  const feitas = paradas.filter((p) => entregues[p.pedido.id!]).length;

  function alternar(id: number) {
    const desejado = !entregues[id];
    setErro(null);
    iniciar(async () => {
      marcar({ id, entregue: desejado });
      const r = await chamarAcao(() => definirEntregueAcao(id, desejado));
      if (!r.ok) setErro(r.erro);
    });
  }

  if (paradas.length === 0) {
    return (
      <main className={estilos.conteudo}>
        <p className={estilos.vazio}>Nenhuma entrega nesta leva.</p>
      </main>
    );
  }

  return (
    <main className={estilos.conteudo}>
      <p className={estilos.contagem} aria-live="polite">
        {feitas} de {paradas.length} {paradas.length === 1 ? 'entregue' : 'entregues'}
      </p>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
      <ol className={estilos.lista}>
        {paradas.map((p) => {
          const id = p.pedido.id!;
          const feita = entregues[id];
          return (
            <li key={id} className={`${estilos.card} ${feita ? estilos.cardFeito : ''}`}>
              <div className={estilos.topo}>
                <span className={estilos.numero} aria-hidden="true">
                  {p.numero}
                </span>
                <div className={estilos.info}>
                  <span className={estilos.nome}>{p.cliente.nome}</span>
                  <span className={estilos.endereco}>{p.cliente.endereco}</span>
                  <span className={estilos.pedido}>{p.resumo}</span>
                  {p.anotacoes.map((a, i) => (
                    <span key={i} className={estilos.anotacao}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div className={estilos.botoes}>
                <a
                  href={linkMapa(p.cliente.endereco)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classeBotao('contorno')}
                >
                  Abrir mapa
                </a>
                <button
                  type="button"
                  className={classeBotao(feita ? 'claro' : 'principal')}
                  onClick={() => alternar(id)}
                  aria-pressed={feita}
                >
                  {feita ? 'Entregue ✓' : 'Entregue'}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
    </main>
  );
}

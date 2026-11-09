'use client';

import { type ReactNode, useEffect, useId, useRef } from 'react';
import estilos from './Folha.module.css';

interface Props {
  aberta: boolean;
  aoFechar: () => void;
  titulo: string;
  children: ReactNode;
}

/**
 * Folha que sobe de baixo. Usa <dialog> nativo: prende o foco e fecha com Esc.
 * Tocar fora não fecha: um toque sem querer não apaga o que foi digitado.
 */
export function Folha({ aberta, aoFechar, titulo, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberta && !d.open) d.showModal();
    if (!aberta && d.open) d.close();
  }, [aberta]);

  return (
    <dialog
      ref={ref}
      className={estilos.folha}
      aria-labelledby={idTitulo}
      onClose={aoFechar}
    >
      <div className={estilos.conteudo}>
        <div className={estilos.topo}>
          <h2 id={idTitulo} className={estilos.titulo}>
            {titulo}
          </h2>
          <button type="button" className={estilos.fechar} onClick={aoFechar} aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {aberta && children}
      </div>
    </dialog>
  );
}

import type { ReactNode } from 'react';
import estilos from './Aviso.module.css';

export function Aviso({ tipo = 'info', children }: { tipo?: 'info' | 'erro' | 'ok'; children: ReactNode }) {
  return (
    <div className={`${estilos.aviso} ${estilos[tipo]}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

import type { HTMLAttributes } from 'react';
import estilos from './Card.module.css';

interface Props extends HTMLAttributes<HTMLDivElement> {
  estado?: 'normal' | 'feito';
}

export function Card({ estado = 'normal', className, ...resto }: Props) {
  return <div className={[estilos.card, estado === 'feito' ? estilos.feito : '', className].filter(Boolean).join(' ')} {...resto} />;
}

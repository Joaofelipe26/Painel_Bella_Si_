import type { ButtonHTMLAttributes } from 'react';
import estilos from './Botao.module.css';

type Variante = 'principal' | 'contorno' | 'claro' | 'laranja';

export function classeBotao(variante: Variante = 'principal', largo = false): string {
  return [estilos.botao, estilos[variante], largo ? estilos.largo : ''].filter(Boolean).join(' ');
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  largo?: boolean;
}

export function Botao({ variante = 'principal', largo = false, className, type = 'button', ...resto }: Props) {
  return <button type={type} className={[classeBotao(variante, largo), className].filter(Boolean).join(' ')} {...resto} />;
}

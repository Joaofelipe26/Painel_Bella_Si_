import type { ReactNode } from 'react';
import estilos from './Cabecalho.module.css';
import { Logo } from './Logo';

interface Props {
  titulo: string;
  subtitulo?: ReactNode;
  comLogo?: boolean;
  children?: ReactNode;
}

export function Cabecalho({ titulo, subtitulo, comLogo = false, children }: Props) {
  return (
    <header className={estilos.cabecalho}>
      {comLogo && <Logo claro />}
      <h1 className={estilos.titulo}>{titulo}</h1>
      {subtitulo && <p className={estilos.subtitulo}>{subtitulo}</p>}
      {children}
    </header>
  );
}

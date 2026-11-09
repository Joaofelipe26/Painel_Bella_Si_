import type { Metadata } from 'next';
import { Logo } from '@/ui/Logo';
import estilos from './entrar.module.css';
import { FormEntrar } from './FormEntrar';

export const metadata: Metadata = { title: 'Entrar · Bella Si' };

export default function PaginaEntrar() {
  return (
    <main className={estilos.pagina}>
      <div className={estilos.marca}>
        <Logo tamanho={48} />
        <p className={estilos.sub}>COZINHA SAUDÁVEL</p>
      </div>
      <h1 className={estilos.titulo}>Painel de pedidos</h1>
      <FormEntrar />
    </main>
  );
}

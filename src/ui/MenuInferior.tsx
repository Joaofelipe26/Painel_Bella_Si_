'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import estilos from './MenuInferior.module.css';

const ITENS = [
  { href: '/hoje', rotulo: 'Hoje' },
  { href: '/pedidos', rotulo: 'Pedidos' },
  { href: '/entregas', rotulo: 'Entregas' },
  { href: '/cadastros', rotulo: 'Cadastros' },
] as const;

export function MenuInferior() {
  const caminho = usePathname();
  return (
    <nav className={estilos.menu} aria-label="Menu principal">
      {ITENS.map((item) => {
        const ativo = caminho.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${estilos.item} ${ativo ? estilos.ativo : ''}`}
            aria-current={ativo ? 'page' : undefined}
          >
            {item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

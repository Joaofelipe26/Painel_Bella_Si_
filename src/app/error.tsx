'use client';

import { useEffect } from 'react';
import { Botao } from '@/ui/Botao';
import { Logo } from '@/ui/Logo';
import estilos from './erro.module.css';

export default function Erro({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={estilos.pagina}>
      <Logo tamanho={40} />
      <h1 className={estilos.titulo}>Não foi possível abrir esta tela</h1>
      <p className={estilos.texto}>Confira a internet do celular e toque no botão abaixo.</p>
      <Botao largo onClick={() => retry()}>
        Tentar de novo
      </Botao>
    </main>
  );
}

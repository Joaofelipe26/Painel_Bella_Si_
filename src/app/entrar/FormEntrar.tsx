'use client';

import { useActionState } from 'react';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { entrarAcao, type EstadoEntrar } from './acoes';
import estilos from './entrar.module.css';

const inicial: EstadoEntrar = { erro: null };

export function FormEntrar() {
  const [estado, acao, pendente] = useActionState(entrarAcao, inicial);
  return (
    <form action={acao} className={estilos.form}>
      <label className={estilos.rotulo} htmlFor="pin">
        Digite o PIN
      </label>
      <input
        id="pin"
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        pattern="[0-9]*"
        required
        autoFocus
        className={estilos.campo}
        aria-describedby={estado.erro ? 'erro-pin' : undefined}
      />
      {estado.erro && (
        <div id="erro-pin">
          <Aviso tipo="erro">{estado.erro}</Aviso>
        </div>
      )}
      <Botao type="submit" largo disabled={pendente}>
        {pendente ? 'Entrando…' : 'Entrar'}
      </Botao>
    </form>
  );
}

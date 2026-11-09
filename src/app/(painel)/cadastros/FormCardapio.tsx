'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { diasUteis, somarDias } from '@/dominio/datas';
import { NOME_BASICO, type CardapioDia } from '@/dominio/tipos';
import { dataCurta, nomeDoDia } from '@/lib/formatos';
import type { RespostaAcao } from '@/lib/resultado';
import { chamarAcao } from '@/lib/rede';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { salvarCardapioAcao } from './acoes';
import estilos from './cadastros.module.css';

export function FormCardapio({ segunda, dias }: { segunda: string; dias: Record<string, CardapioDia | null> }) {
  const [estado, acao, pendente] = useActionState<RespostaAcao | null, FormData>(
    (anterior, dados) => chamarAcao(() => salvarCardapioAcao(anterior, dados)),
    null,
  );
  const datas = diasUteis(segunda);

  return (
    <>
      <div className={estilos.seletorSemana}>
        <Link href={`/cadastros?aba=cardapio&semana=${somarDias(segunda, -7)}`} className={estilos.seta} aria-label="Semana anterior">
          ‹
        </Link>
        <span className={estilos.semanaTexto}>
          {dataCurta(datas[0])} a {dataCurta(datas[4])}
        </span>
        <Link href={`/cadastros?aba=cardapio&semana=${somarDias(segunda, 7)}`} className={estilos.seta} aria-label="Próxima semana">
          ›
        </Link>
      </div>

      <form action={acao} className={estilos.form}>
        {datas.map((data) => {
          const d = dias[data];
          return (
            <fieldset key={data} className={estilos.dia}>
              <legend className={estilos.diaTitulo}>
                {nomeDoDia(data)} {dataCurta(data)}
              </legend>
              <input type="hidden" name="data" value={data} />
              <label className={estilos.grupo}>
                <span className={estilos.rotulo}>Prato do dia</span>
                <input name={`pratoDia-${data}`} defaultValue={d?.pratoDia ?? ''} className={estilos.campo} autoComplete="off" />
              </label>
              <label className={estilos.grupo}>
                <span className={estilos.rotulo}>Acompanhamento</span>
                <input name={`pratoDiaDesc-${data}`} defaultValue={d?.pratoDiaDesc ?? ''} className={estilos.campo} autoComplete="off" />
              </label>
              <label className={estilos.grupo}>
                <span className={estilos.rotulo}>Vegetariano</span>
                <input name={`veg-${data}`} defaultValue={d?.veg ?? ''} className={estilos.campo} autoComplete="off" />
              </label>
              <label className={estilos.grupo}>
                <span className={estilos.rotulo}>Acompanhamento do vegetariano</span>
                <input name={`vegDesc-${data}`} defaultValue={d?.vegDesc ?? ''} className={estilos.campo} autoComplete="off" />
              </label>
            </fieldset>
          );
        })}

        <div className={estilos.basicos}>
          <p className={estilos.diaTitulo}>Basiquinhos (todos os dias)</p>
          <ul>
            {Object.values(NOME_BASICO).map((n) => (
              <li key={n}>{n} + arroz + feijão + legumes</li>
            ))}
          </ul>
        </div>

        {estado && (estado.ok ? <Aviso tipo="ok">Cardápio salvo.</Aviso> : <Aviso tipo="erro">{estado.erro}</Aviso>)}

        <Botao type="submit" largo disabled={pendente}>
          {pendente ? 'Salvando…' : 'Salvar semana'}
        </Botao>
      </form>
    </>
  );
}

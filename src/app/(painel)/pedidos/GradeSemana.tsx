'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { diasUteis, somarDias } from '@/dominio/datas';
import { NOME_PLANO, type CardapioDia, type Cliente, type Pedido } from '@/dominio/tipos';
import { celula, dataCurta, nomeDoDia, siglaDoDia } from '@/lib/formatos';
import { chamarAcao } from '@/lib/rede';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { repetirSemanaAcao } from './acoes';
import { FolhaPedido } from './FolhaPedido';
import estilos from './pedidos.module.css';

function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

interface Props {
  segunda: string;
  clientes: Cliente[];
  pedidos: Pedido[];
  cardapio: Record<string, CardapioDia | null>;
}

export function GradeSemana({ segunda, clientes, pedidos, cardapio }: Props) {
  const dias = diasUteis(segunda);
  const [busca, setBusca] = useState('');
  const [aberta, setAberta] = useState<{ cliente: Cliente; data: string } | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [repetindo, iniciarRepetir] = useTransition();

  const porChave = new Map(pedidos.map((p) => [`${p.clienteId}|${p.data}`, p]));
  const filtro = normalizar(busca.trim());
  const visiveis = clientes.filter((c) => normalizar(c.nome).includes(filtro));

  function repetir() {
    if (!window.confirm('Copiar os pedidos da semana passada para os dias vazios que ainda não fecharam?')) return;
    iniciarRepetir(async () => {
      const r = await chamarAcao(() => repetirSemanaAcao(segunda));
      if (!r.ok) setMensagem({ tipo: 'erro', texto: r.erro });
      else if (r.criados === 0) setMensagem({ tipo: 'ok', texto: 'Nada para copiar.' });
      else setMensagem({ tipo: 'ok', texto: `${r.criados} ${r.criados === 1 ? 'pedido copiado' : 'pedidos copiados'}.` });
    });
  }

  return (
    <>
      <header className={estilos.cabecalho}>
        <div className={estilos.semana}>
          <Link href={`/pedidos?semana=${somarDias(segunda, -7)}`} className={estilos.seta} aria-label="Semana anterior">
            ‹
          </Link>
          <h1 className={estilos.titulo}>
            Pedidos · {dataCurta(dias[0]).slice(0, 2)} a {dataCurta(dias[4])}
          </h1>
          <Link href={`/pedidos?semana=${somarDias(segunda, 7)}`} className={estilos.seta} aria-label="Próxima semana">
            ›
          </Link>
        </div>
        <label className={estilos.busca}>
          Buscar cliente
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome"
            className={estilos.campoBusca}
          />
        </label>
      </header>

      <main className={estilos.conteudo}>
        {mensagem && <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>}

        <div className={estilos.linhaTitulos} aria-hidden="true">
          <span className={estilos.colNome}>Cliente</span>
          {dias.map((d) => (
            <span key={d}>{siglaDoDia(d)}</span>
          ))}
        </div>

        {clientes.length === 0 ? (
          <p className={estilos.vazio}>
            Nenhum cliente ainda. Cadastre em <Link href="/cadastros">Cadastros</Link>.
          </p>
        ) : visiveis.length === 0 ? (
          <p className={estilos.vazio}>Nenhum cliente com esse nome.</p>
        ) : (
          <ul className={estilos.linhas}>
            {visiveis.map((c) => (
              <li key={c.id} className={estilos.linha}>
                <div className={estilos.colNome}>
                  <span className={estilos.nome}>{c.nome}</span>
                  <span className={estilos.plano}>{NOME_PLANO[c.plano]}</span>
                </div>
                {dias.map((d) => {
                  const p = porChave.get(`${c.id}|${d}`);
                  const { rotulo, tipo } = celula(p);
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`${estilos.celula} ${estilos[tipo]}`}
                      onClick={() => setAberta({ cliente: c, data: d })}
                      aria-label={`${c.nome}, ${nomeDoDia(d).toLowerCase()} ${dataCurta(d)}: ${p ? rotulo : 'sem pedido'}`}
                    >
                      {rotulo}
                    </button>
                  );
                })}
              </li>
            ))}
          </ul>
        )}

        <p className={estilos.legenda}>
          PD = prato do dia · V = vegetariano · Basic C = carne · Basic F = frango · Basic O = omelete
          · M = marmitão · 2 = duas marmitas
        </p>

        <Botao variante="contorno" largo onClick={repetir} disabled={repetindo}>
          {repetindo ? 'Copiando…' : 'Repetir semana passada'}
        </Botao>
      </main>

      <FolhaPedido
        aberta={aberta}
        pedido={aberta ? porChave.get(`${aberta.cliente.id}|${aberta.data}`) : undefined}
        cardapio={aberta ? cardapio[aberta.data] ?? null : null}
        aoFechar={() => setAberta(null)}
      />
    </>
  );
}

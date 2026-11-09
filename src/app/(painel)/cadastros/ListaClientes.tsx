'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { NOME_PLANO, PLANOS, type Cliente } from '@/dominio/tipos';
import type { RespostaAcao } from '@/lib/resultado';
import { chamarAcao } from '@/lib/rede';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { Folha } from '@/ui/Folha';
import { definirAtivoAcao, salvarClienteAcao } from './acoes';
import estilos from './cadastros.module.css';

function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function ListaClientes({ clientes }: { clientes: Cliente[] }) {
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Cliente | 'novo' | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const filtro = normalizar(busca.trim());
  const ativos = clientes.filter((c) => c.ativo && normalizar(c.nome).includes(filtro));
  const inativos = clientes.filter((c) => !c.ativo);

  return (
    <>
      <div className={estilos.barra}>
        <label className={estilos.campoBusca}>
          <span className={estilos.rotulo}>Buscar cliente</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Digite o nome"
            className={estilos.campo}
          />
        </label>
        <Botao largo onClick={() => setEditando('novo')}>
          + Novo cliente
        </Botao>
      </div>

      {mensagem && <Aviso tipo={mensagem.tipo}>{mensagem.texto}</Aviso>}

      {ativos.length === 0 ? (
        <p className={estilos.vazio}>{busca ? 'Nenhum cliente com esse nome.' : 'Nenhum cliente cadastrado ainda.'}</p>
      ) : (
        <ul className={estilos.lista}>
          {ativos.map((c) => (
            <li key={c.id}>
              <button type="button" className={estilos.itemCliente} onClick={() => setEditando(c)}>
                <span className={estilos.nome}>{c.nome}</span>
                <span className={estilos.detalhe}>
                  {NOME_PLANO[c.plano]} · {c.leva}ª leva{c.bairro ? ` · ${c.bairro}` : ''}
                  {c.marmitaoPadrao ? ' · marmitão' : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {inativos.length > 0 && (
        <details className={estilos.inativos}>
          <summary>Clientes desativados ({inativos.length})</summary>
          <ul className={estilos.lista}>
            {inativos.map((c) => (
              <li key={c.id} className={estilos.itemInativo}>
                <span className={estilos.nome}>{c.nome}</span>
                <BotaoAtivo id={c.id} ativo={false} aoTerminar={setMensagem} />
              </li>
            ))}
          </ul>
        </details>
      )}

      <Folha
        aberta={editando !== null}
        aoFechar={() => setEditando(null)}
        titulo={editando === 'novo' ? 'Novo cliente' : editando ? `Editar ${editando.nome}` : ''}
      >
        {editando && (
          <FormCliente
            key={editando === 'novo' ? 'novo' : editando.id}
            cliente={editando === 'novo' ? null : editando}
            aoSalvar={(m) => {
              setEditando(null);
              setMensagem(m);
            }}
          />
        )}
      </Folha>
    </>
  );
}

function BotaoAtivo({
  id,
  ativo,
  aoTerminar,
}: {
  id: number;
  ativo: boolean;
  aoTerminar: (m: { tipo: 'ok' | 'erro'; texto: string }) => void;
}) {
  const [pendente, iniciar] = useTransition();
  return (
    <Botao
      variante="contorno"
      disabled={pendente}
      onClick={() => {
        if (ativo && !window.confirm('Desativar este cliente? Ele some da grade, e os pedidos dele a partir de amanhã são apagados.')) return;
        iniciar(async () => {
          const r = await chamarAcao(() => definirAtivoAcao(id, !ativo));
          aoTerminar(
            r.ok
              ? { tipo: 'ok', texto: ativo ? 'Cliente desativado.' : 'Cliente reativado.' }
              : { tipo: 'erro', texto: r.erro },
          );
        });
      }}
    >
      {ativo ? 'Desativar cliente' : 'Reativar'}
    </Botao>
  );
}

function FormCliente({
  cliente,
  aoSalvar,
}: {
  cliente: Cliente | null;
  aoSalvar: (m: { tipo: 'ok' | 'erro'; texto: string }) => void;
}) {
  const [estado, acao, pendente] = useActionState<RespostaAcao | null, FormData>(
    (anterior, dados) => chamarAcao(() => salvarClienteAcao(anterior, dados)),
    null,
  );

  useEffect(() => {
    if (estado?.ok) aoSalvar({ tipo: 'ok', texto: cliente ? 'Cliente salvo.' : 'Cliente cadastrado.' });
  }, [estado, cliente, aoSalvar]);

  return (
    <form action={acao} className={estilos.form}>
      {cliente && <input type="hidden" name="id" value={cliente.id} />}
      <Campo rotulo="Nome" nome="nome" valor={cliente?.nome} obrigatorio autoComplete="off" />
      <Campo rotulo="Endereço" nome="endereco" valor={cliente?.endereco} obrigatorio autoComplete="off" />
      <Campo rotulo="Bairro" nome="bairro" valor={cliente?.bairro} autoComplete="off" />
      <Campo rotulo="Telefone" nome="telefone" valor={cliente?.telefone} tipo="tel" autoComplete="off" />

      <div className={estilos.duasColunas}>
        <label className={estilos.grupo}>
          <span className={estilos.rotulo}>Leva</span>
          <select name="leva" defaultValue={cliente?.leva ?? 1} className={estilos.campo}>
            <option value="1">1ª leva</option>
            <option value="2">2ª leva</option>
            <option value="3">3ª leva</option>
          </select>
        </label>
        <Campo rotulo="Ordem na rota" nome="ordemRota" valor={String(cliente?.ordemRota ?? 0)} tipo="number" />
      </div>

      <label className={estilos.grupo}>
        <span className={estilos.rotulo}>Plano</span>
        <select name="plano" defaultValue={cliente?.plano ?? 'P02'} className={estilos.campo}>
          {PLANOS.map((p) => (
            <option key={p} value={p}>
              {NOME_PLANO[p]}
              {p === 'P01' ? ' (6 na semana)' : p === 'P02' ? ' (5 na semana)' : ''}
            </option>
          ))}
        </select>
      </label>

      <label className={estilos.checagem}>
        <input type="checkbox" name="marmitaoPadrao" defaultChecked={cliente?.marmitaoPadrao ?? false} />
        <span>
          <b>Sempre marmitão</b>
          <br />O pedido já começa com marmitão
        </span>
      </label>

      <Campo rotulo="Anotação fixa (ex.: 3 sacolas)" nome="anotacaoFixa" valor={cliente?.anotacaoFixa} autoComplete="off" />

      {estado && !estado.ok && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <Botao type="submit" largo disabled={pendente}>
        {pendente ? 'Salvando…' : 'Salvar cliente'}
      </Botao>
      {cliente && <BotaoAtivo id={cliente.id} ativo aoTerminar={aoSalvar} />}
    </form>
  );
}

function Campo(props: {
  rotulo: string;
  nome: string;
  valor?: string | null;
  tipo?: string;
  obrigatorio?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className={estilos.grupo}>
      <span className={estilos.rotulo}>{props.rotulo}</span>
      <input
        name={props.nome}
        type={props.tipo ?? 'text'}
        defaultValue={props.valor ?? ''}
        required={props.obrigatorio}
        autoComplete={props.autoComplete}
        inputMode={props.tipo === 'number' ? 'numeric' : undefined}
        min={props.tipo === 'number' ? 0 : undefined}
        className={estilos.campo}
      />
    </label>
  );
}

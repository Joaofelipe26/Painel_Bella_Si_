'use client';

import { useState, useTransition } from 'react';
import { diaEstaAberto } from '@/dominio/datas';
import { nomeDaLinha } from '@/dominio/producao';
import { quantidadeSugerida } from '@/dominio/semana';
import { OPCOES, QUANTIDADE_MAX, QUANTIDADE_MIN, type CardapioDia, type Cliente, type Opcao, type Pedido } from '@/dominio/tipos';
import { dataCurta, nomeDoDia } from '@/lib/formatos';
import { chamarAcao } from '@/lib/rede';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { Folha } from '@/ui/Folha';
import { apagarPedidoAcao, salvarPedidoAcao } from './acoes';
import estilos from './pedidos.module.css';

interface Props {
  aberta: { cliente: Cliente; data: string } | null;
  pedido: Pedido | undefined;
  cardapio: CardapioDia | null;
  aoFechar: () => void;
}

export function FolhaPedido({ aberta, pedido, cardapio, aoFechar }: Props) {
  const titulo = aberta ? `${aberta.cliente.nome} · ${nomeDoDia(aberta.data).toLowerCase()} ${dataCurta(aberta.data)}` : '';
  return (
    <Folha aberta={aberta !== null} aoFechar={aoFechar} titulo={titulo}>
      {aberta && (
        <Conteudo
          key={`${aberta.cliente.id}|${aberta.data}`}
          cliente={aberta.cliente}
          data={aberta.data}
          pedido={pedido}
          cardapio={cardapio}
          aoFechar={aoFechar}
        />
      )}
    </Folha>
  );
}

function Conteudo({
  cliente,
  data,
  pedido,
  cardapio,
  aoFechar,
}: {
  cliente: Cliente;
  data: string;
  pedido: Pedido | undefined;
  cardapio: CardapioDia | null;
  aoFechar: () => void;
}) {
  const [opcao, setOpcao] = useState<Opcao | null>(pedido?.opcao ?? null);
  const [quantidade, setQuantidade] = useState(pedido?.quantidade ?? quantidadeSugerida(cliente.plano, data));
  const [marmitao, setMarmitao] = useState(pedido?.marmitao ?? cliente.marmitaoPadrao);
  const [anotacao, setAnotacao] = useState(pedido?.anotacao ?? '');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, iniciar] = useTransition();
  const fechado = !diaEstaAberto(data, new Date());

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = await chamarAcao(async () =>
        opcao === null
          ? pedido
            ? apagarPedidoAcao(cliente.id, data)
            : { ok: true as const }
          : salvarPedidoAcao({ clienteId: cliente.id, data, opcao, quantidade, marmitao, anotacao }),
      );
      if (r.ok) aoFechar();
      else setErro(r.erro);
    });
  }

  return (
    <div className={estilos.folha}>
      {fechado && <Aviso>Os pedidos deste dia já fecharam. Você ainda pode mudar.</Aviso>}

      <fieldset className={estilos.opcoes}>
        <legend className="so-leitor">Escolha a opção</legend>
        {OPCOES.map((o) => {
          const { titulo, detalhe } = nomeDaLinha(o, cardapio);
          const marcada = opcao === o;
          return (
            <button
              key={o}
              type="button"
              className={`${estilos.opcao} ${marcada ? estilos.opcaoMarcada : ''}`}
              aria-pressed={marcada}
              onClick={() => setOpcao(o)}
            >
              <span className={estilos.opcaoTitulo}>{titulo}</span>
              {detalhe && <span className={estilos.opcaoDetalhe}>{detalhe}</span>}
            </button>
          );
        })}
        <button
          type="button"
          className={`${estilos.opcao} ${estilos.semPedido} ${opcao === null ? estilos.opcaoMarcada : ''}`}
          aria-pressed={opcao === null}
          onClick={() => setOpcao(null)}
        >
          <span className={estilos.opcaoTitulo}>Sem pedido</span>
        </button>
      </fieldset>

      {opcao !== null && (
        <>
          <div className={estilos.quantidade}>
            <span className={estilos.rotulo} id="rotulo-qtd">
              Quantidade
            </span>
            <div className={estilos.contador} role="group" aria-labelledby="rotulo-qtd">
              <button
                type="button"
                className={estilos.botaoQtd}
                onClick={() => setQuantidade((q) => Math.max(QUANTIDADE_MIN, q - 1))}
                disabled={quantidade <= QUANTIDADE_MIN}
                aria-label="Menos uma"
              >
                −
              </button>
              <output className={estilos.valorQtd} aria-live="polite">
                {quantidade}
              </output>
              <button
                type="button"
                className={estilos.botaoQtd}
                onClick={() => setQuantidade((q) => Math.min(QUANTIDADE_MAX, q + 1))}
                disabled={quantidade >= QUANTIDADE_MAX}
                aria-label="Mais uma"
              >
                +
              </button>
            </div>
          </div>

          <label className={estilos.checagem}>
            <input type="checkbox" checked={marmitao} onChange={(e) => setMarmitao(e.target.checked)} />
            <span>
              <b>Marmitão</b>
              <br />
              Porção mais caprichada
            </span>
          </label>

          <label className={estilos.grupo}>
            <span className={estilos.rotulo}>Anotação (ex.: sem feijão)</span>
            <input
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              className={estilos.campo}
              autoComplete="off"
            />
          </label>
        </>
      )}

      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <Botao largo onClick={salvar} disabled={salvando}>
        {salvando ? 'Salvando…' : 'Salvar'}
      </Botao>
    </div>
  );
}

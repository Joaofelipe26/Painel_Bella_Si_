import type { Metadata } from 'next';
import { getDb } from '@/db/cliente';
import { cardapioDoDia } from '@/db/consultas/cardapio';
import { listarClientes } from '@/db/consultas/clientes';
import { pedidosDoDia } from '@/db/consultas/pedidos';
import { hojeSP } from '@/dominio/datas';
import { contarPorLeva, contarProducao, nomeDaLinha, textoResumoLeva } from '@/dominio/producao';
import { OPCOES } from '@/dominio/tipos';
import { textoCorte, tituloHoje } from '@/lib/formatos';
import { Cabecalho } from '@/ui/Cabecalho';
import estilos from './hoje.module.css';

export const metadata: Metadata = { title: 'Hoje · Bella Si' };
export const dynamic = 'force-dynamic';

export default async function PaginaHoje() {
  const agora = new Date();
  const hoje = hojeSP(agora);
  const db = await getDb();
  const [pedidos, cardapio, clientes] = await Promise.all([
    pedidosDoDia(db, hoje),
    cardapioDoDia(db, hoje),
    listarClientes(db, { incluirInativos: true }),
  ]);

  const producao = contarProducao(pedidos);
  const porLeva = contarPorLeva(pedidos, clientes);
  const nomes = new Map(clientes.map((c) => [c.id, c.nome]));
  const totalMarmitoes = producao.marmitoes.reduce((s, m) => s + m.quantidade, 0);

  return (
    <>
      <Cabecalho comLogo titulo={tituloHoje(hoje)} subtitulo={textoCorte(agora)} />
      <main className={estilos.conteudo}>
        <h2 className={estilos.secao}>O que cozinhar</h2>
        {producao.total === 0 ? (
          <p className={estilos.vazio}>Nenhum pedido para hoje.</p>
        ) : (
          <>
            <div className={estilos.lista}>
              {OPCOES.filter((o) => producao.porOpcao[o] > 0).map((o) => {
                const { titulo, detalhe } = nomeDaLinha(o, cardapio);
                return (
                  <div key={o} className={estilos.linha}>
                    <div className={estilos.nomes}>
                      <span className={estilos.titulo}>{titulo}</span>
                      {detalhe && <span className={estilos.detalhe}>{detalhe}</span>}
                    </div>
                    <span className={estilos.qtd}>{producao.porOpcao[o]}</span>
                  </div>
                );
              })}
              <div className={estilos.total}>
                <span>Total</span>
                <span>
                  {producao.total} {producao.total === 1 ? 'marmita' : 'marmitas'}
                </span>
              </div>
            </div>

            {totalMarmitoes > 0 && (
              <div className={estilos.marmitoes}>
                <b>
                  {totalMarmitoes} {totalMarmitoes === 1 ? 'marmitão' : 'marmitões'}
                </b>{' '}
                hoje: {producao.marmitoes.map((m) => nomes.get(m.clienteId) ?? '?').join(', ')}
              </div>
            )}

            <h2 className={estilos.secao}>Por leva</h2>
            <ul className={estilos.levas}>
              {porLeva.map(({ leva, resumo }) => (
                <li key={leva} className={estilos.leva}>
                  <span className={estilos.levaNome}>{leva}ª leva</span>
                  <span className={estilos.levaResumo}>{textoResumoLeva(resumo)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}

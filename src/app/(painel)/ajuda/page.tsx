import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from '@/ui/Cabecalho';
import estilos from './ajuda.module.css';

export const metadata: Metadata = { title: 'Como usar · Bella Si' };

export default function PaginaAjuda() {
  return (
    <>
      <Cabecalho titulo="Como usar o painel" subtitulo="Guia rápido para a Simone e o Bruno" />
      <main className={estilos.conteudo}>
        <section className={estilos.bloco} aria-labelledby="simone">
          <h2 id="simone" className={estilos.titulo}>
            Simone
          </h2>

          <h3 className={estilos.subtitulo}>No domingo: preparar a semana</h3>
          <ol className={estilos.passos}>
            <li>
              Abra <b>Cadastros → Cardápio</b>. Escreva o prato do dia e o vegetariano de cada dia e toque em{' '}
              <b>Salvar semana</b>.
            </li>
            <li>
              Abra <b>Pedidos</b>. No fim de semana, a tela já mostra a próxima semana.
            </li>
            <li>
              Toque em <b>Repetir semana passada</b> para copiar os pedidos dos clientes fixos. Depois, mude só o que for
              diferente.
            </li>
          </ol>

          <h3 className={estilos.subtitulo}>Marcar um pedido</h3>
          <ol className={estilos.passos}>
            <li>Em Pedidos, toque no quadradinho do cliente e do dia.</li>
            <li>Escolha a opção, a quantidade e, se for o caso, o marmitão e uma anotação.</li>
            <li>
              Toque em <b>Salvar</b>. Para tirar o pedido do dia, escolha <b>Sem pedido</b> e salve.
            </li>
          </ol>
          <p className={estilos.legenda}>
            PD = prato do dia · V = vegetariano · Basic C = carne · Basic F = frango · Basic O = omelete · +M = marmitão ·
            “2 PD” = duas marmitas. Na sexta, o prato do dia é a tilápia.
          </p>

          <h3 className={estilos.subtitulo}>Todo dia: o que cozinhar</h3>
          <p>
            Abra <b>Hoje</b>. A tela mostra quantas marmitas fazer de cada opção, o total, quem pediu marmitão e o resumo de
            cada leva. Os pedidos fecham às 9h, mas você ainda pode mudar depois disso.
          </p>

          <h3 className={estilos.subtitulo}>Clientes</h3>
          <ul className={estilos.passos}>
            <li>
              <b>Cadastros → + Novo cliente</b>: nome, endereço, leva e a ordem na rota (1 = primeira entrega da leva).
            </li>
            <li>
              Marque <b>Sempre marmitão</b> para quem sempre pede. Use a <b>anotação fixa</b> para coisas como “3 sacolas”.
            </li>
            <li>
              Cliente que parou: abra o cliente e toque em <b>Desativar cliente</b>. Os pedidos dele a partir de amanhã
              saem.
            </li>
          </ul>
        </section>

        <section className={estilos.bloco} aria-labelledby="bruno">
          <h2 id="bruno" className={estilos.titulo}>
            Bruno
          </h2>
          <ol className={estilos.passos}>
            <li>
              Abra <b>Entregas</b> e escolha a leva: <b>1ª</b>, <b>2ª</b> ou <b>3ª</b>.
            </li>
            <li>As paradas já estão na ordem da rota. A anotação em laranja é importante (ex.: “3 sacolas”).</li>
            <li>
              Toque em <b>Abrir mapa</b> para ver o caminho no Google Maps.
            </li>
            <li>
              Depois de entregar, toque em <b>Entregue</b>. Se tocou sem querer, toque de novo em <b>Entregue ✓</b> para
              desfazer.
            </li>
          </ol>
        </section>

        <section className={estilos.bloco} aria-labelledby="dicas">
          <h2 id="dicas" className={estilos.titulo}>
            Dicas
          </h2>
          <ul className={estilos.passos}>
            <li>
              Deixe o painel na tela inicial do celular. Android: menu ⋮ → <b>Adicionar à tela inicial</b>. iPhone: botão de
              compartilhar → <b>Adicionar à Tela de Início</b>.
            </li>
            <li>
              Se aparecer “Sem conexão. Tente de novo.”, confira a internet e toque de novo. Nada é perdido.
            </li>
            <li>O PIN é o mesmo para os dois. Depois de errar 5 vezes, o painel espera um pouco antes de deixar tentar de novo.</li>
          </ul>
        </section>

        <Link href="/cadastros" className={estilos.voltar}>
          Voltar para Cadastros
        </Link>
      </main>
    </>
  );
}

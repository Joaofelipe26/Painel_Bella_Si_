import type { Metadata } from 'next';
import Link from 'next/link';
import { sairAcao } from '@/app/entrar/acoes';
import { getDb } from '@/db/cliente';
import { cardapioDaSemana } from '@/db/consultas/cardapio';
import { listarClientes } from '@/db/consultas/clientes';
import { hojeSP, segundaDaSemana } from '@/dominio/datas';
import { Cabecalho } from '@/ui/Cabecalho';
import estilos from './cadastros.module.css';
import { FormCardapio } from './FormCardapio';
import { ListaClientes } from './ListaClientes';

export const metadata: Metadata = { title: 'Cadastros · Bella Si' };

function semanaValida(v: unknown, padrao: string): string {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? segundaDaSemana(v) : padrao;
}

export default async function PaginaCadastros({ searchParams }: PageProps<'/cadastros'>) {
  const params = await searchParams;
  const aba = params.aba === 'cardapio' ? 'cardapio' : 'clientes';
  const db = await getDb();
  const segunda = semanaValida(params.semana, segundaDaSemana(hojeSP(new Date())));

  return (
    <>
      <Cabecalho titulo="Cadastros">
        <nav className={estilos.abas} aria-label="Escolha o cadastro">
          <Link href="/cadastros" className={`${estilos.aba} ${aba === 'clientes' ? estilos.abaAtiva : ''}`} aria-current={aba === 'clientes' ? 'page' : undefined}>
            Clientes
          </Link>
          <Link href="/cadastros?aba=cardapio" className={`${estilos.aba} ${aba === 'cardapio' ? estilos.abaAtiva : ''}`} aria-current={aba === 'cardapio' ? 'page' : undefined}>
            Cardápio
          </Link>
        </nav>
      </Cabecalho>
      <main className={estilos.conteudo}>
        {aba === 'clientes' ? (
          <ListaClientes clientes={await listarClientes(db, { incluirInativos: true })} />
        ) : (
          <FormCardapio key={segunda} segunda={segunda} dias={await cardapioDaSemana(db, segunda)} />
        )}
        <form action={sairAcao} className={estilos.sair}>
          <button type="submit" className={estilos.botaoSair}>
            Sair do painel
          </button>
        </form>
      </main>
    </>
  );
}

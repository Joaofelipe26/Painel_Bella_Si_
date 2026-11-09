/**
 * Dados de demonstração para o computador e para os testes.
 * Uso: npm run db:semear            (adiciona, se o banco estiver vazio)
 *      npm run db:semear -- --limpar (apaga .pglite/ antes)
 * Não roda com DATABASE_URL: o banco de produção começa vazio.
 */
import { diasUteis, hojeSP, segundaDaSemana } from '@/dominio/datas';
import { quantidadeSugerida } from '@/dominio/semana';
import type { CardapioDia, Cliente, Opcao } from '@/dominio/tipos';
import type { Db } from './cliente';
import { salvarCardapio } from './consultas/cardapio';
import { listarClientes, salvarCliente } from './consultas/clientes';
import { salvarPedido } from './consultas/pedidos';

type NovoCliente = Omit<Cliente, 'id'>;

function c(nome: string, endereco: string, leva: 1 | 2 | 3, ordemRota: number, extra: Partial<NovoCliente> = {}): NovoCliente {
  return {
    nome,
    telefone: null,
    endereco,
    bairro: 'Centro',
    leva,
    ordemRota,
    plano: 'P02',
    marmitaoPadrao: false,
    anotacaoFixa: null,
    ativo: true,
    ...extra,
  };
}

const CLIENTES: NovoCliente[] = [
  c('Fernando', 'R. João Carlos Paixão, 117', 1, 1, { plano: 'AVULSO' }),
  c('Edu', 'R. Cel. Joaquim Leonel, 129', 1, 2, { plano: 'P01', anotacaoFixa: '3 sacolas' }),
  c('J. Marcos', 'R. João Adolfo, 274', 1, 3),
  c('Dona Lurdes', 'R. Exemplo, 10', 1, 4),
  c('Michel', 'R. Dr. João Batista Lobato, 700 (escritório)', 2, 1, { marmitaoPadrao: true, anotacaoFixa: 'Sacola' }),
  c('Ana', 'R. Exemplo, 20', 2, 2, { marmitaoPadrao: true }),
  c('Sr. Jorge', 'R. Exemplo, 30', 2, 3, { marmitaoPadrao: true }),
  c('Carla', 'R. Exemplo, 40', 2, 4),
  c('Alexandra', 'R. Firmino José Araújo, 242', 3, 1),
  c('Maria Isabel', 'R. Exemplo, 50', 3, 2),
  c('Rita', 'R. Exemplo, 60', 3, 3),
  c('Paulo', 'R. Exemplo, 70', 3, 4, { plano: 'P01' }),
];

/** Escolha de cada cliente, de segunda a sexta. null = sem pedido. */
const ESCOLHAS: Record<string, (Opcao | null)[]> = {
  Fernando: [null, null, 'PD', null, null],
  Edu: ['PD', 'BASIC_F', 'PD', 'BASIC_F', 'PD'],
  'J. Marcos': [null, null, 'BASIC_C', 'BASIC_C', null],
  'Dona Lurdes': ['VEG', 'VEG', 'VEG', 'VEG', 'VEG'],
  Michel: ['PD', 'PD', 'PD', 'PD', 'PD'],
  Ana: ['PD', 'PD', 'PD', 'PD', 'PD'],
  'Sr. Jorge': ['BASIC_F', 'BASIC_F', 'BASIC_F', 'BASIC_F', 'BASIC_F'],
  Carla: ['PD', null, 'PD', null, 'PD'],
  Alexandra: ['VEG', 'VEG', 'VEG', 'VEG', 'VEG'],
  'Maria Isabel': ['PD', 'PD', 'PD', 'BASIC_T', 'PD'],
  Rita: [null, 'BASIC_T', 'BASIC_T', null, 'BASIC_T'],
  Paulo: ['VEG', 'PD', 'VEG', 'PD', 'VEG'],
};

const PRATOS: [string, string, string, string][] = [
  ['Braseado de patinho', 'com purê de mandioquinha', 'Grão-de-bico ao curry', 'com arroz integral'],
  ['Frango com cogumelos', 'ao molho branco leve', 'Escondidinho de abóbora', 'com lentilha'],
  ['Almôndegas de patinho', 'ao molho de tomates frescos', 'Almôndegas de lentilha', 'ao molho de tomate'],
  ['Strogonoff de frango', 'com arroz e batata rústica', 'Strogonoff de palmito', 'com arroz'],
  ['Filé de tilápia', 'com legumes assados', 'Moqueca de banana-da-terra', 'com arroz'],
];

export async function semear(db: Db, agora: Date = new Date()): Promise<void> {
  if ((await listarClientes(db, { incluirInativos: true })).length > 0) return;

  const dias = diasUteis(segundaDaSemana(hojeSP(agora)));
  const cardapio: CardapioDia[] = dias.map((data, i) => ({
    data,
    pratoDia: PRATOS[i][0],
    pratoDiaDesc: PRATOS[i][1],
    veg: PRATOS[i][2],
    vegDesc: PRATOS[i][3],
  }));
  await salvarCardapio(db, cardapio);

  for (const novo of CLIENTES) {
    const cliente = await salvarCliente(db, novo);
    const escolhas = ESCOLHAS[cliente.nome];
    for (let i = 0; i < dias.length; i++) {
      const opcao = escolhas[i];
      if (!opcao) continue;
      await salvarPedido(db, {
        clienteId: cliente.id,
        data: dias[i],
        opcao,
        quantidade: quantidadeSugerida(cliente.plano, dias[i]),
        marmitao: cliente.marmitaoPadrao,
        anotacao: cliente.nome === 'Michel' && i === 2 ? 'sem feijão' : null,
      });
    }
  }
}

async function principal(): Promise<void> {
  if (process.env.DATABASE_URL) {
    console.error('Recusado: DATABASE_URL está definida. Os dados de demonstração são só para o computador.');
    process.exit(1);
  }
  if (process.argv.includes('--limpar')) {
    const { rm } = await import('node:fs/promises');
    await rm('.pglite', { recursive: true, force: true });
  }
  const { criarDb } = await import('./cliente');
  const db = await criarDb();
  await semear(db);
  console.log('Dados de demonstração prontos.');
  process.exit(0);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('src/db/semear.ts')) {
  void principal();
}

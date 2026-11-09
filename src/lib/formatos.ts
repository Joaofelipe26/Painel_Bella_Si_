import { diaDaSemana, ehDiaUtil, hojeSP, minutosAteCorte } from '@/dominio/datas';
import { HORARIO_CORTE, SIGLA, type Pedido } from '@/dominio/tipos';

/** '09:00' → '9h'; '09:30' → '9h30' */
function horaCurta(horario: string): string {
  const [h, m] = horario.split(':');
  return `${Number(h)}h${m === '00' ? '' : m}`;
}

/** Linha do corte na tela Hoje. */
export function textoCorte(agora: Date): string {
  const hoje = hojeSP(agora);
  if (!ehDiaUtil(hoje)) return 'Sem entregas hoje';
  const faltam = minutosAteCorte(hoje, agora);
  if (faltam === null) return 'Pedidos fechados';
  return `Pedidos fecham às ${horaCurta(HORARIO_CORTE)} · ${textoFaltam(faltam)}`;
}

export type TipoCelula = 'vazio' | 'normal' | 'veg' | 'marmitao';

/** Texto e cor da célula da grade de pedidos. */
export function celula(p: Pick<Pedido, 'opcao' | 'quantidade' | 'marmitao'> | undefined): {
  rotulo: string;
  tipo: TipoCelula;
} {
  if (!p) return { rotulo: '–', tipo: 'vazio' };
  const base = `${p.quantidade > 1 ? `${p.quantidade} ` : ''}${SIGLA[p.opcao]}${p.marmitao ? '+M' : ''}`;
  const tipo: TipoCelula = p.marmitao ? 'marmitao' : p.opcao === 'VEG' ? 'veg' : 'normal';
  return { rotulo: base, tipo };
}

const NOMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const SIGLAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** '2026-11-09' → '09/11' */
export function dataCurta(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

export function nomeDoDia(data: string): string {
  return NOMES[diaDaSemana(data)];
}

export function siglaDoDia(data: string): string {
  return SIGLAS[diaDaSemana(data)];
}

/** 'Hoje, quarta 11/11' */
export function tituloHoje(data: string): string {
  return `Hoje, ${nomeDoDia(data).toLowerCase()} ${dataCurta(data)}`;
}

/** 80 → 'faltam 1h20'; 45 → 'faltam 45 min' */
export function textoFaltam(minutos: number): string {
  if (minutos < 60) return `faltam ${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `faltam ${h}h${m ? String(m).padStart(2, '0') : ''}`;
}

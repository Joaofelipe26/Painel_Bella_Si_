import { diaDaSemana } from '@/dominio/datas';

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

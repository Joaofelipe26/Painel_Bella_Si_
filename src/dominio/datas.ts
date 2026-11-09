import { HORARIO_CORTE } from './tipos';

const FUSO = 'America/Sao_Paulo';

const formatoDataHora = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function partesSP(agora: Date): { data: string; minutos: number } {
  const p = Object.fromEntries(formatoDataHora.formatToParts(agora).map((x) => [x.type, x.value]));
  return {
    data: `${p.year}-${p.month}-${p.day}`,
    minutos: Number(p.hour) * 60 + Number(p.minute),
  };
}

/** Meio-dia UTC evita erro de dia em qualquer fuso. */
function meioDia(data: string): Date {
  return new Date(`${data}T12:00:00Z`);
}

function paraTexto(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function minutosDoHorario(horario: string): number {
  const [h, m] = horario.split(':').map(Number);
  return h * 60 + m;
}

export function hojeSP(agora: Date): string {
  return partesSP(agora).data;
}

/** 0 = domingo, 6 = sábado. */
export function diaDaSemana(data: string): number {
  return meioDia(data).getUTCDay();
}

export function somarDias(data: string, n: number): string {
  const d = meioDia(data);
  d.setUTCDate(d.getUTCDate() + n);
  return paraTexto(d);
}

export function segundaDaSemana(data: string): string {
  const dia = diaDaSemana(data);
  const voltar = dia === 0 ? 6 : dia - 1;
  return somarDias(data, -voltar);
}

export function diasUteis(segunda: string): string[] {
  return [0, 1, 2, 3, 4].map((n) => somarDias(segunda, n));
}

/** Texto no formato AAAA-MM-DD que é uma data real (2026-02-30 não é). */
export function dataValida(v: unknown): v is string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Semana que a tela abre: a atual em dia útil; a próxima no sábado e no domingo. */
export function semanaPadrao(hoje: string): string {
  return ehDiaUtil(hoje) ? segundaDaSemana(hoje) : segundaDaSemana(somarDias(hoje, 2));
}

export function ehDiaUtil(data: string): boolean {
  const dia = diaDaSemana(data);
  return dia >= 1 && dia <= 5;
}

export function diaEstaAberto(data: string, agora: Date, corte: string = HORARIO_CORTE): boolean {
  return minutosAteCorte(data, agora, corte) !== null;
}

/** Minutos até o corte do dia. null quando o dia já fechou ou não tem entrega. */
export function minutosAteCorte(data: string, agora: Date, corte: string = HORARIO_CORTE): number | null {
  if (!ehDiaUtil(data)) return null;
  const hoje = partesSP(agora);
  if (data < hoje.data) return null;
  const dias = Math.round((meioDia(data).getTime() - meioDia(hoje.data).getTime()) / 86_400_000);
  const faltam = dias * 1440 + minutosDoHorario(corte) - hoje.minutos;
  return faltam > 0 ? faltam : null;
}

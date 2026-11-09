import type { z } from 'zod';

export type Resultado<T> = { ok: true; valor: T } | { ok: false; erro: string };
export type RespostaAcao = { ok: true } | { ok: false; erro: string };

/** Valida com Zod e devolve a primeira mensagem de erro em português. */
export function validar<S extends z.ZodType>(esquema: S, dados: unknown): Resultado<z.output<S>> {
  const r = esquema.safeParse(dados);
  if (r.success) return { ok: true, valor: r.data };
  return { ok: false, erro: r.error.issues[0]?.message ?? 'Confira os dados.' };
}

/** Texto do formulário: tira espaços; vazio vira null. */
export function textoOuNulo(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

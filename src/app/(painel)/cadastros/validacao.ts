import { z } from 'zod';
import { ehDiaUtil } from '@/dominio/datas';
import { PLANOS } from '@/dominio/tipos';
import type { CardapioDia, Cliente, Leva } from '@/dominio/tipos';
import { textoOuNulo, validar, type Resultado } from '@/lib/resultado';

const textoOpcional = z.unknown().optional().transform(textoOuNulo);

const esquemaCliente = z.object({
  id: z.coerce.number().int().positive().optional().catch(undefined),
  nome: z.string({ error: 'Digite o nome.' }).trim().min(1, 'Digite o nome.'),
  telefone: textoOpcional,
  endereco: z.string({ error: 'Digite o endereço.' }).trim().min(1, 'Digite o endereço.'),
  bairro: textoOpcional,
  leva: z.coerce
    .number()
    .int()
    .min(1, 'Escolha a leva: 1, 2 ou 3.')
    .max(3, 'Escolha a leva: 1, 2 ou 3.')
    .transform((n) => n as Leva),
  ordemRota: z.coerce.number({ error: 'Digite a ordem na rota.' }).int().min(0, 'A ordem na rota deve ser 0 ou mais.'),
  plano: z.enum(PLANOS as [string, ...string[]], { error: 'Escolha o plano.' }).transform((p) => p as Cliente['plano']),
  marmitaoPadrao: z.unknown().optional().transform((v) => v === 'on' || v === true || v === 'true'),
  anotacaoFixa: textoOpcional,
});

export type DadosCliente = Omit<Cliente, 'id' | 'ativo'> & { id?: number };

export function validarCliente(dados: unknown): Resultado<DadosCliente> {
  const r = validar(esquemaCliente, dados);
  if (!r.ok) return r;
  const { id, ...resto } = r.valor;
  return { ok: true, valor: id ? { id, ...resto } : resto };
}

const esquemaDia = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
    .refine(ehDiaUtil, 'Escolha um dia de segunda a sexta.'),
  pratoDia: textoOpcional,
  pratoDiaDesc: textoOpcional,
  veg: textoOpcional,
  vegDesc: textoOpcional,
});

export function validarCardapio(dias: unknown): Resultado<CardapioDia[]> {
  return validar(z.array(esquemaDia).max(5), dias);
}

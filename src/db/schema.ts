import { boolean, date, integer, pgTable, serial, smallint, text, timestamp, unique } from 'drizzle-orm/pg-core';
import type { Leva, Opcao, Plano } from '@/dominio/tipos';

export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  nome: text('nome').notNull(),
  telefone: text('telefone'),
  endereco: text('endereco').notNull(),
  bairro: text('bairro'),
  leva: smallint('leva').$type<Leva>().notNull().default(1),
  ordemRota: integer('ordem_rota').notNull().default(0),
  plano: text('plano').$type<Plano>().notNull().default('AVULSO'),
  marmitaoPadrao: boolean('marmitao_padrao').notNull().default(false),
  anotacaoFixa: text('anotacao_fixa'),
  ativo: boolean('ativo').notNull().default(true),
});

export const cardapioDia = pgTable('cardapio_dia', {
  data: date('data', { mode: 'string' }).primaryKey(),
  pratoDia: text('prato_dia'),
  pratoDiaDesc: text('prato_dia_desc'),
  veg: text('veg'),
  vegDesc: text('veg_desc'),
});

export const pedidos = pgTable(
  'pedidos',
  {
    id: serial('id').primaryKey(),
    clienteId: integer('cliente_id')
      .notNull()
      .references(() => clientes.id),
    data: date('data', { mode: 'string' }).notNull(),
    opcao: text('opcao').$type<Opcao>().notNull(),
    quantidade: smallint('quantidade').notNull().default(1),
    marmitao: boolean('marmitao').notNull().default(false),
    anotacao: text('anotacao'),
    entregueEm: timestamp('entregue_em', { withTimezone: true }),
  },
  (t) => [unique('pedidos_cliente_data').on(t.clienteId, t.data)],
);

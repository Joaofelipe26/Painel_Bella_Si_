import { z } from 'zod';
import { ehDiaUtil } from '@/dominio/datas';
import { OPCOES, QUANTIDADE_MAX, QUANTIDADE_MIN, type Opcao, type Pedido } from '@/dominio/tipos';
import { textoOuNulo, validar, type Resultado } from '@/lib/resultado';

const esquemaPedido = z.object({
  clienteId: z.number({ error: 'Escolha um cliente.' }).int().positive('Escolha um cliente.'),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
    .refine(ehDiaUtil, 'Escolha um dia de segunda a sexta.'),
  opcao: z.enum(OPCOES as [Opcao, ...Opcao[]], { error: 'Escolha uma opção.' }),
  quantidade: z
    .number({ error: 'A quantidade vai de 1 a 3.' })
    .int()
    .min(QUANTIDADE_MIN, 'A quantidade vai de 1 a 3.')
    .max(QUANTIDADE_MAX, 'A quantidade vai de 1 a 3.'),
  marmitao: z.boolean(),
  anotacao: z.unknown().transform(textoOuNulo),
});

export function validarPedido(dados: unknown): Resultado<Pedido> {
  return validar(esquemaPedido, dados);
}

export type Opcao = 'PD' | 'VEG' | 'BASIC_C' | 'BASIC_F' | 'BASIC_O' | 'BASIC_T';
export type Basico = 'BASIC_C' | 'BASIC_F' | 'BASIC_O' | 'BASIC_T';
export type Plano = 'P01' | 'P02' | 'AVULSO';
export type Leva = 1 | 2 | 3;

/** Opções que a Simone pode escolher. A tilápia é o prato do dia da sexta, não um basiquinho. */
export const OPCOES: readonly Opcao[] = ['PD', 'VEG', 'BASIC_C', 'BASIC_F', 'BASIC_O'];
/** Todas as opções, inclusive BASIC_T, para contar e mostrar pedidos antigos. */
export const OPCOES_TODAS: readonly Opcao[] = [...OPCOES, 'BASIC_T'];
export const BASICOS: readonly Basico[] = ['BASIC_C', 'BASIC_F', 'BASIC_O'];
export const PLANOS: readonly Plano[] = ['P01', 'P02', 'AVULSO'];
export const LEVAS: readonly Leva[] = [1, 2, 3];

export const SIGLA: Record<Opcao, string> = {
  PD: 'PD',
  VEG: 'V',
  BASIC_C: 'Basic C',
  BASIC_F: 'Basic F',
  BASIC_O: 'Basic O',
  BASIC_T: 'Basic T',
};

export const NOME_BASICO: Record<Basico, string> = {
  BASIC_C: 'Patinho moído',
  BASIC_F: 'Filé de frango grelhado',
  BASIC_O: 'Omelete de legumes',
  BASIC_T: 'Filé de tilápia grelhado',
};

export const NOME_PLANO: Record<Plano, string> = {
  P01: 'Plano 01',
  P02: 'Plano 02',
  AVULSO: 'Avulso',
};

export const HORARIO_CORTE = '09:00';
export const QUANTIDADE_MIN = 1;
export const QUANTIDADE_MAX = 3;

export interface Pedido {
  id?: number;
  clienteId: number;
  data: string;
  opcao: Opcao;
  quantidade: number;
  marmitao: boolean;
  anotacao: string | null;
  entregueEm?: Date | null;
}

export interface Cliente {
  id: number;
  nome: string;
  telefone: string | null;
  endereco: string;
  bairro: string | null;
  leva: Leva;
  ordemRota: number;
  plano: Plano;
  marmitaoPadrao: boolean;
  anotacaoFixa: string | null;
  ativo: boolean;
}

export interface CardapioDia {
  data: string;
  pratoDia: string | null;
  pratoDiaDesc: string | null;
  veg: string | null;
  vegDesc: string | null;
}

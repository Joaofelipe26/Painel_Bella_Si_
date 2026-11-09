import { criarDb, type Db } from './cliente';

/** Banco PGlite em memória, com as migrações aplicadas. Só para testes. */
export function criarDbDeTeste(): Promise<Db> {
  return criarDb(undefined, null);
}

export const ERRO_REDE = 'Sem conexão. Tente de novo.';

/**
 * Chama uma ação do servidor pelo navegador. Se a rede falhar, devolve o erro
 * em português no lugar de quebrar a tela.
 */
export async function chamarAcao<T extends { ok: boolean }>(
  acao: () => Promise<T>,
): Promise<T | { ok: false; erro: string }> {
  try {
    return await acao();
  } catch {
    return { ok: false, erro: ERRO_REDE };
  }
}

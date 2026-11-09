'use client';

import { useState, useTransition } from 'react';
import { chamarAcao } from '@/lib/rede';
import { Aviso } from '@/ui/Aviso';
import { Botao } from '@/ui/Botao';
import { Folha } from '@/ui/Folha';
import { importarClientesAcao } from './acoes';
import estilos from './cadastros.module.css';
import { lerPlanilhaClientes, type LeituraPlanilha } from './planilha';

/** O Excel salva CSV em UTF-8 ("CSV UTF-8") ou em Windows-1252 ("CSV"). Tenta os dois. */
async function lerTexto(arquivo: File): Promise<string> {
  const bytes = await arquivo.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

export function ImportarPlanilha({ aoTerminar }: { aoTerminar: (m: { tipo: 'ok' | 'erro'; texto: string }) => void }) {
  const [aberta, setAberta] = useState(false);
  const [texto, setTexto] = useState('');
  const [leitura, setLeitura] = useState<LeituraPlanilha | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [importando, iniciar] = useTransition();

  function fechar() {
    setAberta(false);
    setTexto('');
    setLeitura(null);
    setErro(null);
  }

  async function escolher(arquivo: File | undefined) {
    setErro(null);
    if (!arquivo) return;
    const t = await lerTexto(arquivo);
    setTexto(t);
    setLeitura(lerPlanilhaClientes(t));
  }

  function importar() {
    iniciar(async () => {
      const r = await chamarAcao(() => importarClientesAcao(texto));
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      const partes = [`${r.criados} ${r.criados === 1 ? 'cliente importado' : 'clientes importados'}.`];
      if (r.ignorados.length > 0) partes.push(`Já existiam: ${r.ignorados.join(', ')}.`);
      fechar();
      aoTerminar({ tipo: 'ok', texto: partes.join(' ') });
    });
  }

  return (
    <>
      <Botao variante="contorno" largo onClick={() => setAberta(true)}>
        Importar planilha
      </Botao>
      <Folha aberta={aberta} aoFechar={fechar} titulo="Importar planilha">
        <ol className={estilos.passos}>
          <li>
            Baixe o <a href="/modelo-clientes.csv" download>modelo da planilha</a> e preencha um cliente por linha.
          </li>
          <li>No Excel, salve como “CSV UTF-8”.</li>
          <li>Escolha o arquivo abaixo e confira a lista.</li>
        </ol>
        <label className={estilos.grupo}>
          <span className={estilos.rotulo}>Arquivo da planilha (.csv)</span>
          <input
            type="file"
            accept=".csv,text/csv"
            className={estilos.campo}
            onChange={(e) => void escolher(e.target.files?.[0])}
          />
        </label>

        {leitura && (
          <>
            {leitura.clientes.length > 0 && (
              <Aviso tipo="ok">
                {leitura.clientes.length} {leitura.clientes.length === 1 ? 'cliente pronto' : 'clientes prontos'}:{' '}
                {leitura.clientes.map((c) => c.nome).join(', ')}.
              </Aviso>
            )}
            {leitura.erros.length > 0 && (
              <Aviso tipo="erro">
                {leitura.erros.length === 1 ? 'Esta linha fica de fora:' : 'Estas linhas ficam de fora:'}
                <ul className={estilos.listaErros}>
                  {leitura.erros.map((e) => (
                    <li key={e.linha}>
                      Linha {e.linha}: {e.erro}
                    </li>
                  ))}
                </ul>
              </Aviso>
            )}
          </>
        )}

        {erro && <Aviso tipo="erro">{erro}</Aviso>}

        <Botao largo onClick={importar} disabled={!leitura || leitura.clientes.length === 0 || importando}>
          {importando
            ? 'Importando…'
            : leitura && leitura.clientes.length > 0
              ? `Importar ${leitura.clientes.length} ${leitura.clientes.length === 1 ? 'cliente' : 'clientes'}`
              : 'Importar'}
        </Botao>
      </Folha>
    </>
  );
}

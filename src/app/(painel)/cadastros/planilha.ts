import { validarCliente, type DadosCliente } from './validacao';

export interface LeituraPlanilha {
  clientes: DadosCliente[];
  erros: { linha: number; erro: string }[];
}

type Campo = 'nome' | 'endereco' | 'bairro' | 'telefone' | 'plano' | 'leva' | 'ordemRota' | 'marmitaoPadrao' | 'anotacaoFixa';

function normalizar(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function campoDaColuna(titulo: string): Campo | null {
  const t = normalizar(titulo);
  if (t === 'nome') return 'nome';
  if (t.startsWith('endereco')) return 'endereco';
  if (t === 'bairro') return 'bairro';
  if (t.startsWith('telefone') || t === 'celular' || t === 'whatsapp' || t === 'fone') return 'telefone';
  if (t === 'plano') return 'plano';
  if (t === 'leva') return 'leva';
  if (t.startsWith('ordem')) return 'ordemRota';
  if (t.includes('marmitao')) return 'marmitaoPadrao';
  if (t.startsWith('anotacao') || t.startsWith('observacao') || t === 'obs') return 'anotacaoFixa';
  return null;
}

/** Lê CSV com aspas e quebra de linha dentro de aspas. Devolve cada registro com a linha onde começa. */
function lerRegistros(texto: string, separador: string): { linha: number; valores: string[] }[] {
  const registros: { linha: number; valores: string[] }[] = [];
  let valores: string[] = [];
  let atual = '';
  let entreAspas = false;
  let linha = 1;
  let inicio = 1;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreAspas) {
      if (c === '"' && texto[i + 1] === '"') {
        atual += '"';
        i++;
      } else if (c === '"') entreAspas = false;
      else {
        if (c === '\n') linha++;
        atual += c;
      }
    } else if (c === '"') entreAspas = true;
    else if (c === separador) {
      valores.push(atual);
      atual = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      valores.push(atual);
      registros.push({ linha: inicio, valores });
      valores = [];
      atual = '';
      linha++;
      inicio = linha;
    } else atual += c;
  }
  if (atual !== '' || valores.length > 0) {
    valores.push(atual);
    registros.push({ linha: inicio, valores });
  }
  return registros;
}

function converterPlano(v: string): string {
  const t = normalizar(v);
  if (t === '' || t.includes('avulso')) return 'AVULSO';
  if (t === '1' || t.endsWith('01') || t === 'plano1') return 'P01';
  if (t === '2' || t.endsWith('02') || t === 'plano2') return 'P02';
  return v;
}

function converterLeva(v: string): string {
  const n = v.match(/\d/);
  return n ? n[0] : '1';
}

function converterSimNao(v: string): string | undefined {
  return ['sim', 's', 'x', 'true', '1', 'yes'].includes(normalizar(v)) ? 'on' : undefined;
}

export function lerPlanilhaClientes(texto: string): LeituraPlanilha {
  const limpo = texto.replace(/^﻿/, '');
  if (limpo.trim() === '') return { clientes: [], erros: [{ linha: 1, erro: 'A planilha está vazia.' }] };

  const primeiraLinha = limpo.split(/\r?\n/, 1)[0];
  const separador = (primeiraLinha.match(/;/g)?.length ?? 0) >= (primeiraLinha.match(/,/g)?.length ?? 0) ? ';' : ',';
  const [cabecalho, ...linhas] = lerRegistros(limpo, separador);
  const campos = cabecalho.valores.map(campoDaColuna);
  if (!campos.includes('nome') || !campos.includes('endereco')) {
    return { clientes: [], erros: [{ linha: 1, erro: 'A planilha precisa das colunas "Nome" e "Endereço".' }] };
  }

  const clientes: DadosCliente[] = [];
  const erros: LeituraPlanilha['erros'] = [];
  for (const { linha, valores } of linhas) {
    if (valores.every((v) => v.trim() === '')) continue;
    const bruto: Partial<Record<Campo, string>> = {};
    campos.forEach((campo, i) => {
      if (campo) bruto[campo] = (valores[i] ?? '').trim();
    });
    const r = validarCliente({
      nome: bruto.nome ?? '',
      endereco: bruto.endereco ?? '',
      bairro: bruto.bairro,
      telefone: bruto.telefone,
      plano: converterPlano(bruto.plano ?? ''),
      leva: converterLeva(bruto.leva ?? ''),
      ordemRota: /\d/.test(bruto.ordemRota ?? '') ? bruto.ordemRota : '0',
      marmitaoPadrao: converterSimNao(bruto.marmitaoPadrao ?? ''),
      anotacaoFixa: bruto.anotacaoFixa,
    });
    if (r.ok) clientes.push(r.valor);
    else erros.push({ linha, erro: r.erro });
  }
  return { clientes, erros };
}

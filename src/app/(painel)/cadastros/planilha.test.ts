import { describe, expect, it } from 'vitest';
import { lerPlanilhaClientes } from './planilha';

const CABECALHO = 'Nome;Endereço;Bairro;Telefone;Plano;Leva;Ordem na rota;Sempre marmitão;Anotação fixa';

describe('lerPlanilhaClientes', () => {
  it('lê o modelo com ponto e vírgula (Excel em português)', () => {
    const texto = `${CABECALHO}\nEdu;R. Cel. Joaquim Leonel, 129;Centro;(15) 99999-0000;Plano 01;1;2;não;3 sacolas\n`;
    const r = lerPlanilhaClientes(texto);
    expect(r.erros).toEqual([]);
    expect(r.clientes).toEqual([
      {
        nome: 'Edu',
        endereco: 'R. Cel. Joaquim Leonel, 129',
        bairro: 'Centro',
        telefone: '(15) 99999-0000',
        plano: 'P01',
        leva: 1,
        ordemRota: 2,
        marmitaoPadrao: false,
        anotacaoFixa: '3 sacolas',
      },
    ]);
  });

  it('aceita vírgula, aspas, BOM do Excel e cabeçalho sem acento', () => {
    const texto = '﻿nome,endereco,plano,leva,marmitao\n"Michel","R. Dr. João Batista Lobato, 700",02,2,sim\n';
    const r = lerPlanilhaClientes(texto);
    expect(r.erros).toEqual([]);
    expect(r.clientes[0]).toMatchObject({
      nome: 'Michel',
      endereco: 'R. Dr. João Batista Lobato, 700',
      plano: 'P02',
      leva: 2,
      marmitaoPadrao: true,
      ordemRota: 0,
    });
  });

  it('entende os jeitos comuns de escrever plano, leva e marmitão', () => {
    const texto = `${CABECALHO}\nA;Rua A;;;avulso;3ª;;X;\nB;Rua B;;;2;2ª leva;;s;\nC;Rua C;;;;;;;\n`;
    const r = lerPlanilhaClientes(texto);
    expect(r.erros).toEqual([]);
    expect(r.clientes.map((c) => [c.plano, c.leva, c.marmitaoPadrao])).toEqual([
      ['AVULSO', 3, true],
      ['P02', 2, true],
      ['AVULSO', 1, false],
    ]);
  });

  it('pula linhas vazias e aponta a linha com erro', () => {
    const texto = `${CABECALHO}\n\nSem endereço;;;;;;;;\nOk;Rua 1;;;;;;;\n;;;;;;;;\n`;
    const r = lerPlanilhaClientes(texto);
    expect(r.clientes.map((c) => c.nome)).toEqual(['Ok']);
    expect(r.erros).toEqual([{ linha: 3, erro: 'Digite o endereço.' }]);
  });

  it('avisa quando falta a coluna Nome ou Endereço', () => {
    expect(lerPlanilhaClientes('Cliente;Rua\nEdu;R 1').erros).toEqual([
      { linha: 1, erro: 'A planilha precisa das colunas "Nome" e "Endereço".' },
    ]);
  });

  it('planilha vazia', () => {
    expect(lerPlanilhaClientes('')).toEqual({ clientes: [], erros: [{ linha: 1, erro: 'A planilha está vazia.' }] });
  });
});

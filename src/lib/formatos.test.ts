import { describe, expect, it } from 'vitest';
import { celula, dataCurta, nomeDoDia, siglaDoDia, textoFaltam, tituloHoje } from './formatos';

describe('celula', () => {
  const p = { clienteId: 1, data: '2026-11-11', anotacao: null };
  it('sem pedido', () => {
    expect(celula(undefined)).toEqual({ rotulo: '–', tipo: 'vazio' });
  });
  it('prato do dia', () => {
    expect(celula({ ...p, opcao: 'PD', quantidade: 1, marmitao: false })).toEqual({ rotulo: 'PD', tipo: 'normal' });
  });
  it('vegetariano', () => {
    expect(celula({ ...p, opcao: 'VEG', quantidade: 1, marmitao: false })).toEqual({ rotulo: 'V', tipo: 'veg' });
  });
  it('basiquinho', () => {
    expect(celula({ ...p, opcao: 'BASIC_F', quantidade: 1, marmitao: false })).toEqual({ rotulo: 'Basic F', tipo: 'normal' });
  });
  it('marmitão', () => {
    expect(celula({ ...p, opcao: 'PD', quantidade: 1, marmitao: true })).toEqual({ rotulo: 'PD+M', tipo: 'marmitao' });
  });
  it('duas marmitas', () => {
    expect(celula({ ...p, opcao: 'PD', quantidade: 2, marmitao: false })).toEqual({ rotulo: '2 PD', tipo: 'normal' });
  });
});

describe('formatos', () => {
  it('dataCurta', () => {
    expect(dataCurta('2026-11-09')).toBe('09/11');
  });
  it('nomeDoDia', () => {
    expect(nomeDoDia('2026-11-09')).toBe('Segunda');
    expect(nomeDoDia('2026-11-11')).toBe('Quarta');
    expect(nomeDoDia('2026-11-15')).toBe('Domingo');
  });
  it('siglaDoDia', () => {
    expect(siglaDoDia('2026-11-13')).toBe('Sex');
  });
  it('tituloHoje', () => {
    expect(tituloHoje('2026-11-11')).toBe('Hoje, quarta 11/11');
  });
  it('textoFaltam', () => {
    expect(textoFaltam(80)).toBe('faltam 1h20');
    expect(textoFaltam(45)).toBe('faltam 45 min');
    expect(textoFaltam(120)).toBe('faltam 2h');
    expect(textoFaltam(1500)).toBe('faltam 25h');
  });
});

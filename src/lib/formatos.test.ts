import { describe, expect, it } from 'vitest';
import { dataCurta, nomeDoDia, siglaDoDia, textoFaltam, tituloHoje } from './formatos';

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

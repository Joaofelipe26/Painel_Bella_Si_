import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { razaoDeContraste } from './contraste';

const css = readFileSync(path.join(__dirname, 'tokens.css'), 'utf8');

function token(nome: string): string {
  if (nome.startsWith('#')) return nome;
  const m = css.match(new RegExp(`--cor-${nome}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`Token --cor-${nome} não encontrado`);
  return m[1];
}

describe('razaoDeContraste', () => {
  it('preto e branco dão 21', () => {
    expect(razaoDeContraste('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
  });
  it('cor igual dá 1', () => {
    expect(razaoDeContraste('#3F5A1E', '#3F5A1E')).toBeCloseTo(1, 5);
  });
});

describe('pares de texto do design system', () => {
  it.each([
    ['texto', 'creme'],
    ['texto-suave', 'creme'],
    ['texto-suave', '#FFFFFF'],
    ['#FFFFFF', 'verde'],
    ['#FFFFFF', 'laranja-texto'],
    ['texto', 'laranja'],
    ['aviso-texto', 'laranja-claro'],
    ['verde-escuro', 'verde-claro'],
    ['verde-escuro', 'verde-fundo'],
    ['verde', '#FFFFFF'],
    ['verde', 'creme'],
    ['laranja-texto', '#FFFFFF'],
  ])('%s sobre %s tem contraste de 4.5 ou mais', (frente, fundo) => {
    expect(razaoDeContraste(token(frente), token(fundo))).toBeGreaterThanOrEqual(4.5);
  });
});

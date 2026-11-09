import { describe, expect, it } from 'vitest';
import { BASICOS, OPCOES, OPCOES_TODAS } from './tipos';

describe('opções do cardápio', () => {
  it('a tilápia não é basiquinho: é o prato do dia da sexta', () => {
    expect(OPCOES).toEqual(['PD', 'VEG', 'BASIC_C', 'BASIC_F', 'BASIC_O']);
    expect(BASICOS).toEqual(['BASIC_C', 'BASIC_F', 'BASIC_O']);
  });

  it('pedidos antigos de basiquinho de tilápia ainda são contados e mostrados', () => {
    expect(OPCOES_TODAS).toContain('BASIC_T');
  });
});

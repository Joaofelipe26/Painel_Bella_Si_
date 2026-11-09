import { describe, expect, it } from 'vitest';
import { deveMigrar } from './migrar';

describe('deveMigrar', () => {
  it('migra na produção da Vercel', () => {
    expect(deveMigrar({ DATABASE_URL: 'postgres://x', VERCEL_ENV: 'production' })).toBe(true);
  });
  it('não migra no preview da Vercel', () => {
    expect(deveMigrar({ DATABASE_URL: 'postgres://x', VERCEL_ENV: 'preview' })).toBe(false);
  });
  it('não migra sem DATABASE_URL', () => {
    expect(deveMigrar({ VERCEL_ENV: 'production' })).toBe(false);
  });
  it('migra fora da Vercel quando há DATABASE_URL (comando manual)', () => {
    expect(deveMigrar({ DATABASE_URL: 'postgres://x' })).toBe(true);
  });
});

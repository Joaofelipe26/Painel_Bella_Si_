import { expect, type Page } from '@playwright/test';

export async function entrar(page: Page, pin = '1234') {
  await page.goto('/entrar');
  await page.getByLabel('Digite o PIN').fill(pin);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

export async function entrarComSucesso(page: Page) {
  await entrar(page);
  await expect(page).toHaveURL(/\/hoje$/);
}

/** Dia de hoje em São Paulo, no formato das células: "segunda 09/11". null no fim de semana. */
export function hojeNaGrade(): string | null {
  const agora = new Date();
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', ...o }).format(agora);
  const dia = fmt({ weekday: 'long' }).replace('-feira', '').toLowerCase();
  if (dia === 'sábado' || dia === 'domingo') return null;
  return `${dia} ${fmt({ day: '2-digit' })}/${fmt({ month: '2-digit' })}`;
}

/** Nenhuma rolagem horizontal na página. */
export async function semRolagemLateral(page: Page) {
  const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(sobra).toBeLessThanOrEqual(0);
}

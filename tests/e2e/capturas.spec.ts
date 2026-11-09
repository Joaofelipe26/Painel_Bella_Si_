import { expect, test } from '@playwright/test';
import { entrarComSucesso, semRolagemLateral } from './ajuda';

const TELAS = [
  { nome: 'hoje', url: '/hoje', espera: 'O que cozinhar' },
  { nome: 'pedidos', url: '/pedidos', espera: 'Repetir semana passada' },
  { nome: 'entregas', url: '/entregas?leva=1', espera: 'Entregas de hoje' },
  { nome: 'clientes', url: '/cadastros', espera: '+ Novo cliente' },
  { nome: 'cardapio', url: '/cadastros?aba=cardapio', espera: 'Salvar semana' },
  { nome: 'ajuda', url: '/ajuda', espera: 'Como usar o painel' },
];

test('tela de entrada', async ({ page }, info) => {
  await page.goto('/entrar');
  await expect(page.getByLabel('Digite o PIN')).toBeVisible();
  await semRolagemLateral(page);
  await page.screenshot({ path: `test-results/capturas/${info.project.name}-entrar.png`, fullPage: true });
});

test('telas do painel', async ({ page }, info) => {
  await entrarComSucesso(page);
  for (const tela of TELAS) {
    await page.goto(tela.url);
    await expect(page.getByText(tela.espera).first()).toBeVisible();
    await semRolagemLateral(page);
    await page.screenshot({ path: `test-results/capturas/${info.project.name}-${tela.nome}.png`, fullPage: true });
  }
});

test('folhas abertas', async ({ page }, info) => {
  await entrarComSucesso(page);
  await page.goto('/pedidos');
  await page.getByRole('button', { name: /^Edu, / }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: `test-results/capturas/${info.project.name}-folha-pedido.png` });

  await page.goto('/cadastros');
  await page.getByRole('button', { name: '+ Novo cliente' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: `test-results/capturas/${info.project.name}-folha-cliente.png` });
});

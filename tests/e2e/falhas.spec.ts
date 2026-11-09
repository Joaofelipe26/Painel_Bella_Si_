import { expect, test } from '@playwright/test';
import { entrarComSucesso } from './ajuda';

test.describe('falhas de rede e de sessão', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'celular-390', 'Roda só em 390 px');
  });

  test('ação do servidor sem sessão recebe 401, não um redirecionamento', async ({ request }) => {
    const r = await request.post('/pedidos', {
      headers: { 'next-action': '0000000000000000000000000000000000000000', 'content-type': 'text/plain' },
      data: '[]',
      maxRedirects: 0,
    });
    expect(r.status()).toBe(401);
  });

  test('sem conexão ao marcar a entrega, o app avisa e não quebra a tela', async ({ page }) => {
    await entrarComSucesso(page);
    await page.goto('/entregas?leva=1');
    const botao = page.getByRole('button', { name: 'Entregue', exact: true }).first();
    await expect(botao).toBeVisible();
    await page.route('**/entregas**', (rota) =>
      rota.request().method() === 'POST' ? rota.abort('internetdisconnected') : rota.continue(),
    );
    await botao.click();
    await expect(page.getByText('Sem conexão. Tente de novo.')).toBeVisible();
    await expect(page.getByText(/Application error/)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Entregas de hoje' })).toBeVisible();
  });

  test('sem conexão ao salvar o pedido, o app avisa e não quebra a tela', async ({ page }) => {
    await entrarComSucesso(page);
    await page.goto('/pedidos');
    await page.getByRole('button', { name: /^Edu, / }).first().click();
    await page.route('**/pedidos**', (rota) =>
      rota.request().method() === 'POST' ? rota.abort('internetdisconnected') : rota.continue(),
    );
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByRole('dialog').getByText('Sem conexão. Tente de novo.')).toBeVisible();
    await expect(page.getByText(/Application error/)).toHaveCount(0);
  });

  test('tocar fora da folha não fecha e não perde o que foi digitado', async ({ page }) => {
    await entrarComSucesso(page);
    await page.goto('/cadastros');
    await page.getByRole('button', { name: '+ Novo cliente' }).click();
    const folha = page.getByRole('dialog');
    await folha.getByLabel('Nome').fill('Digitado');
    await page.mouse.click(10, 10); // área escura atrás da folha
    await expect(folha).toBeVisible();
    await expect(folha.getByLabel('Nome')).toHaveValue('Digitado');
    await folha.getByRole('button', { name: 'Fechar' }).click();
    await expect(folha).toBeHidden();
  });

  test('data inválida no endereço abre a semana padrão, sem erro', async ({ page }) => {
    await entrarComSucesso(page);
    const r = await page.goto('/pedidos?semana=2026-13-45');
    expect(r?.status()).toBe(200);
    await expect(page.getByRole('heading', { name: /^Pedidos ·/ })).toBeVisible();
  });
});


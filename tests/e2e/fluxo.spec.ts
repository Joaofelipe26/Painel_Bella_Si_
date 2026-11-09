import { expect, test, type Page } from '@playwright/test';
import { entrar, entrarComSucesso, hojeNaGrade } from './ajuda';

test.describe('fluxo principal', () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== 'celular-390', 'O fluxo roda só em 390 px');
  });

  test('PIN errado mostra a mensagem', async ({ page }) => {
    await entrar(page, '0000');
    await expect(page.getByText('PIN errado. Tente de novo.')).toBeVisible();
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test('sem PIN, as telas mandam para /entrar', async ({ page }) => {
    await page.goto('/pedidos');
    await expect(page).toHaveURL(/\/entrar$/);
  });

  test('cadastrar cliente pelo formulário, só com os campos obrigatórios', async ({ page }) => {
    await entrarComSucesso(page);
    await page.goto('/cadastros');
    await page.getByRole('button', { name: '+ Novo cliente' }).click();
    const folha = page.getByRole('dialog');
    await folha.getByLabel('Nome').fill('Cliente Teste E2E');
    await folha.getByLabel('Endereço').fill('R. Teste, 1');
    await folha.getByRole('button', { name: 'Salvar cliente' }).click();
    await expect(page.getByText('Cliente cadastrado.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Cliente Teste E2E/ })).toBeVisible();
  });

  test('salvar o cardápio da semana', async ({ page }) => {
    await entrarComSucesso(page);
    await page.goto('/cadastros?aba=cardapio');
    await page.getByLabel('Prato do dia').first().fill('Prato E2E');
    await page.getByRole('button', { name: 'Salvar semana' }).click();
    await expect(page.getByText('Cardápio salvo.')).toBeVisible();
  });

  test('marcar pedido, ver em Hoje e marcar a entrega', async ({ page }) => {
    test.setTimeout(90_000);
    const hoje = hojeNaGrade();
    test.skip(hoje === null, 'Sem entregas no fim de semana');

    await entrarComSucesso(page);
    await expect(page.getByRole('heading', { name: 'O que cozinhar' })).toBeVisible();
    const totalAntes = await lerTotal(page);

    await page.getByRole('link', { name: 'Pedidos' }).click();
    await expect(page.getByRole('heading', { name: /^Pedidos ·/ })).toBeVisible();
    const vazias = page.getByRole('button', { name: new RegExp(`, ${hoje}: sem pedido$`) });
    test.skip((await vazias.count()) === 0, 'Todos os clientes já têm pedido hoje');
    const rotulo = (await vazias.first().getAttribute('aria-label'))!;
    const nome = rotulo.split(',')[0];

    await vazias.first().click();
    await page.getByRole('button', { name: /^Prato do dia/ }).click();
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByRole('button', { name: `${nome}, ${hoje}: PD` })).toBeVisible();

    await page.getByRole('link', { name: 'Hoje' }).click();
    await expect.poll(() => lerTotal(page), { timeout: 20_000 }).toBe(totalAntes + 1);

    await page.goto('/entregas');
    for (const leva of [1, 2, 3]) {
      await page.goto(`/entregas?leva=${leva}`);
      if ((await page.getByRole('listitem').filter({ hasText: nome }).count()) > 0) break;
    }
    const card = page.getByRole('listitem').filter({ hasText: nome });
    await card.getByRole('button', { name: 'Entregue', exact: true }).click();
    await expect(card.getByRole('button', { name: 'Entregue ✓' })).toBeVisible();
    await expect(page.getByText(/^\d+ de \d+ entregues?$/)).toBeVisible();

    await page.reload();
    await expect(page.getByRole('listitem').filter({ hasText: nome }).getByRole('button', { name: 'Entregue ✓' })).toBeVisible();
  });
});

async function lerTotal(page: Page): Promise<number> {
  const linha = page.getByText(/^\d+ marmitas?$/);
  if ((await linha.count()) === 0) return 0;
  return Number((await linha.textContent())?.match(/\d+/)?.[0] ?? 0);
}

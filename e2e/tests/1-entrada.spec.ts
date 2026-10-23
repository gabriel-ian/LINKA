import { expect, test } from '@playwright/test';
import { ADMIN, lerEstado } from '../api';
import { entrarComo } from './fluxos';

test.describe('Entrada', () => {
  test('a escola entra e cai no próprio painel', async ({ page }) => {
    const { escola } = lerEstado();
    await entrarComo(page, 'Escola', escola.email, escola.senha);
    await expect(page).toHaveURL(/\/escola$/);
    await expect(
      page.getByText(escola.nome, { exact: false }).first(),
    ).toBeVisible();
  });

  test('senha errada mostra o aviso e não entra', async ({ page }) => {
    const { escola } = lerEstado();
    await page.goto('/login');
    await page.getByRole('button', { name: 'Escola' }).first().click();
    await page.locator('input[name=email]').fill(escola.email);
    await page.locator('input[name=senha]').fill('senha-errada');
    await page.locator('button[type=submit]').click();
    await expect(page.getByText('E-mail ou senha incorretos')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('o ADM encontra a escola pela busca', async ({ page }) => {
    const { escola } = lerEstado();
    await page.goto('/adm/login');
    await page.locator('input[name=email]').fill(ADMIN.email);
    await page.locator('input[name=senha]').fill(ADMIN.senha);
    await page.locator('button[type=submit]').click();
    await expect(page).toHaveURL(/\/adm$/);

    await page.goto('/adm/escolas/buscar');
    await page.locator('input[name=texto]').fill(escola.nome);
    await page.getByRole('button', { name: 'Buscar' }).click();
    await expect(
      page.getByRole('heading', { name: escola.nome }),
    ).toBeVisible();
  });
});

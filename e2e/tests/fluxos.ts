import { Page, expect } from '@playwright/test';

export type Perfil = 'Aluno' | 'Família' | 'Professor' | 'Escola';

/** Tela de login: escolhe o perfil, preenche e entra. */
export async function entrarComo(
  page: Page,
  perfil: Perfil,
  email: string,
  senha: string,
): Promise<void> {
  await page.goto('/login');
  await page
    .getByRole('button', { name: perfil, exact: false })
    .first()
    .click();
  await page.locator('input[name=email]').fill(email);
  await page.locator('input[name=senha]').fill(senha);
  await page.locator('button[type=submit]').click();
  await expect(page).not.toHaveURL(/\/login/);
}

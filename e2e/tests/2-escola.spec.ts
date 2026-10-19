import { expect, test } from '@playwright/test';
import { lerEstado } from '../api';
import { entrarComo } from './fluxos';

test.describe('Escola', () => {
  test.beforeEach(async ({ page }) => {
    const { escola } = lerEstado();
    await entrarComo(page, 'Escola', escola.email, escola.senha);
  });

  test('cadastra uma família', async ({ page }) => {
    await page.goto('/escola/cadastro/familia');
    await page.locator('input[name=nome]').fill('Rita Responsável E2E');
    await page.locator('input[name=email]').fill(`rita.${Date.now()}@e2e.linka.dev`);
    await page.locator('input[name=telefone]').fill('(41) 99999-0000');
    await page.locator('button[type=submit]').click();
    await expect(page.getByText('Família cadastrada!')).toBeVisible();
  });

  test('adiciona o aluno sem turma à turma, dentro do limite de vagas', async ({ page }) => {
    const { turma, alunoSemTurma } = lerEstado();
    await page.goto(`/escola/turmas/${turma.id}`);
    await page.getByRole('button', { name: 'Adicionar alunos' }).first().click();

    const janela = page.getByRole('dialog');
    await expect(janela.getByText(/vagas de 30/)).toBeVisible();
    await janela.locator('li', { hasText: alunoSemTurma.nome }).locator('input[type=checkbox]').check();
    await janela.locator('button[type=submit]').click();

    await expect(page.getByText('1 aluno adicionado à turma')).toBeVisible();
    await expect(page.getByText(alunoSemTurma.nome)).toBeVisible();
  });

  test('não enxerga dados de outra escola', async ({ page }) => {
    // Aluno 1 nunca pertence a uma escola recém-criada pelo teste.
    const resposta = await page.request.get(
      `${process.env.E2E_API ?? 'http://localhost:3000'}/painel-escola/alunos/1`,
      {
        headers: {
          Authorization: `Bearer ${await page.evaluate(() => localStorage.getItem('token'))}`,
        },
      },
    );
    expect(resposta.status()).toBe(404);
  });
});

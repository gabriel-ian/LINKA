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
    await page
      .locator('input[name=email]')
      .fill(`rita.${Date.now()}@e2e.linka.dev`);
    await page.locator('input[name=telefone]').fill('(41) 99999-0000');
    await page.locator('button[type=submit]').click();
    await expect(page.getByText('Família cadastrada!')).toBeVisible();

    // Vincula um aluno que ja estava cadastrado sem familia.
    const { alunoSemTurma } = lerEstado();
    await page.goto('/escola/familias');
    await page.locator('.pagina input').first().fill('Rita Responsável E2E');
    const linha = page.locator('tr', { hasText: 'Rita Responsável E2E' });
    await linha.getByRole('button', { name: 'Vincular aluno' }).click();
    await page
      .locator('.linha-vincular select')
      .selectOption({ label: `${alunoSemTurma.nome} - sem turma` });
    await page.getByRole('button', { name: 'Vincular a Rita' }).click();
    await expect(
      page.getByText(`${alunoSemTurma.nome} vinculado(a) a Rita Responsável E2E.`),
    ).toBeVisible();
    await expect(linha.getByText('Carla')).toBeVisible();
  });

  test('adiciona o aluno sem turma à turma, dentro do limite de vagas', async ({
    page,
  }) => {
    const { turma, alunoSemTurma } = lerEstado();
    await page.goto(`/escola/turmas/${turma.id}`);
    await page
      .getByRole('button', { name: 'Adicionar alunos' })
      .first()
      .click();

    const janela = page.getByRole('dialog');
    await expect(janela.getByText(/vagas de 30/)).toBeVisible();
    await janela
      .locator('li', { hasText: alunoSemTurma.nome })
      .locator('input[type=checkbox]')
      .check();
    await janela.locator('button[type=submit]').click();

    await expect(page.getByText('1 aluno adicionado à turma')).toBeVisible();
    await expect(page.getByText(alunoSemTurma.nome)).toBeVisible();
  });

  test('não enxerga dados de outra escola', async ({ page }) => {
    const { alunoDeOutraEscola } = lerEstado();
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const resposta = await page.request.get(
      `${process.env.E2E_API ?? 'http://localhost:3000'}/painel-escola/alunos/${alunoDeOutraEscola.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(resposta.status()).toBe(404);
  });

  test('não enxerga as disciplinas criadas por outra escola', async ({
    page,
  }) => {
    const { disciplinaDeOutraEscola } = lerEstado();
    const api = process.env.E2E_API ?? 'http://localhost:3000';
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const headers = { Authorization: `Bearer ${token}` };

    const opcoes = await (
      await page.request.get(`${api}/painel-escola/opcoes`, { headers })
    ).json();
    const nomes = opcoes.data.disciplinas.map((d: { nome: string }) => d.nome);
    expect(nomes).toContain('Matemática');
    expect(nomes).not.toContain(disciplinaDeOutraEscola);

    const catalogo = await (
      await page.request.get(`${api}/disciplinas`, { headers })
    ).json();
    expect(catalogo.data.map((d: { nome: string }) => d.nome)).not.toContain(
      disciplinaDeOutraEscola,
    );

    await page.goto('/escola/cadastro/professor');
    await expect(
      page.getByRole('button', { name: 'Matemática' }),
    ).toBeVisible();
    await expect(page.getByText(disciplinaDeOutraEscola)).toHaveCount(0);
  });
});

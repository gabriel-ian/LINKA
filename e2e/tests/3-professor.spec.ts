import { expect, test } from '@playwright/test';
import { lerEstado } from '../api';
import { entrarComo } from './fluxos';

test('o professor vê a turma com todos os alunos', async ({ page }) => {
  const { professor, turma, aluno } = lerEstado();
  await entrarComo(page, 'Professor', professor.email, professor.senha);
  await expect(page).toHaveURL(/\/professor$/);

  await page.goto(`/professor/turmas/${turma.id}`);
  await expect(page.getByRole('heading', { name: new RegExp(turma.nome) })).toBeVisible();
  await expect(page.getByText(aluno.nome)).toBeVisible();
  await expect(page.getByRole('button', { name: /Todos/ })).toBeVisible();
});

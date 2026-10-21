import { expect, test } from '@playwright/test';
import { lerEstado } from '../api';
import { entrarComo } from './fluxos';

test.describe.serial('Aluno', () => {
  test('primeiro acesso: mantém a senha recebida e chega ao Início', async ({ page }) => {
    const { aluno } = lerEstado();
    await entrarComo(page, 'Aluno', aluno.email, aluno.senha);
    await expect(page).toHaveURL(/\/primeiro-acesso/);
    await page.getByRole('button', { name: 'Manter a senha recebida' }).click();
    await expect(page).toHaveURL(/\/aluno$/);
    await expect(page.getByRole('heading', { name: 'Olá, Bruno!' })).toBeVisible();
  });

  test('faz a tarefa passo a passo até a missão cumprida', async ({ page }) => {
    const { aluno, tarefa } = lerEstado();
    await entrarComo(page, 'Aluno', aluno.email, aluno.senha);
    await page.goto(`/aluno/tarefas/${tarefa.id}`);
    await expect(page.getByText(tarefa.titulo).first()).toBeVisible();

    const concluir = page.getByRole('button', { name: 'Concluir passo' });
    while (await concluir.isVisible()) {
      await concluir.click();
      if (/concluida/.test(page.url())) break;
      await page.waitForTimeout(300);
    }
    await expect(page.getByRole('heading', { name: 'Missão cumprida!' })).toBeVisible();
  });

  test('sem internet, mostra o aviso e as missões salvas', async ({ page, context }) => {
    const { aluno } = lerEstado();
    await entrarComo(page, 'Aluno', aluno.email, aluno.senha);
    await expect(page.getByRole('heading', { name: 'Olá, Bruno!' })).toBeVisible();

    await context.setOffline(true);
    await expect(page.getByText('Você está sem internet')).toBeVisible();
    await expect(page.getByText('Sem internet agora - mas suas missões estão salvas.')).toBeVisible();
    await context.setOffline(false);
  });

  test('no celular, navega pelas abas do rodapé', async ({ browser }) => {
    const { aluno, tarefa } = lerEstado();
    const contexto = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await contexto.newPage();
    await entrarComo(page, 'Aluno', aluno.email, aluno.senha);

    const abas = page.getByRole('navigation', { name: 'Atalhos' });
    await expect(abas).toBeVisible();
    await abas.getByRole('link', { name: 'Progresso' }).click();
    await expect(page).toHaveURL(/\/aluno\/progresso/);
    await abas.getByRole('link', { name: 'Início' }).click();
    await expect(page).toHaveURL(/\/aluno$/);

    // Dentro de uma tarefa, a aba Tarefas continua marcada.
    await page.goto(`/aluno/tarefas/${tarefa.id}`);
    await expect(abas.getByRole('link', { name: 'Tarefas' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await contexto.close();
  });
});

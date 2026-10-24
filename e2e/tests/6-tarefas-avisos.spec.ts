import { Page, expect, test } from '@playwright/test';
import { api, entrar, lerEstado } from '../api';
import { entrarComo } from './fluxos';

/**
 * Tarefas com o editor de texto, varias turmas, editar/excluir, resposta do
 * aluno, avisos para aluno e familia, "Voltar" e troca de turma.
 */
const marca = Date.now();
const senha = 'SenhaE2e123';
const novo = {
  aluno: {
    nome: 'Lia Entrega E2E',
    email: `lia.${marca}@e2e.linka.dev`,
  },
  familia: { email: `familia.lia.${marca}@e2e.linka.dev`, senha: '' },
  alunoId: 0,
  /** Tarefa criada na turma principal (a copia vai para a turma 2). */
  tarefaId: 0,
};

/** Escreve no editor (TinyMCE fica dentro de um iframe). */
async function escreverNoEditor(page: Page, texto: string): Promise<void> {
  const corpo = page
    .frameLocator('iframe.tox-edit-area__iframe')
    .locator('body');
  await corpo.click();
  await corpo.pressSequentially(texto);
}

async function tokenProfessor(): Promise<string> {
  const { professor } = lerEstado();
  return entrar(professor.email, professor.senha);
}

test.describe.serial('Tarefas e avisos', () => {
  test.beforeAll(async () => {
    const { escola, turma } = lerEstado();
    const tokenEscola = await entrar(escola.email, escola.senha);
    const criado = await api<{
      data: { id: number; responsavel: { senhaProvisoria: string } };
    }>('POST', '/painel-escola/alunos', tokenEscola, {
      nomeCompleto: novo.aluno.nome,
      email: novo.aluno.email,
      senha,
      turmaId: turma.id,
      responsavel: {
        nomeCompleto: 'Rita Familia E2E',
        email: novo.familia.email,
        parentesco: 'Mãe',
      },
    });
    novo.alunoId = criado.data.id;
    novo.familia.senha = criado.data.responsavel.senhaProvisoria;
    await api(
      'POST',
      '/auth/senha/manter',
      await entrar(novo.aluno.email, senha),
      {},
    );
  });

  test('o professor cria a tarefa com o editor para duas turmas', async ({
    page,
  }) => {
    const { professor, turma2 } = lerEstado();
    await entrarComo(page, 'Professor', professor.email, professor.senha);
    await page.goto('/professor/tarefas/nova');

    await page.locator('input[name=titulo]').fill('Leitura E2E');
    await page
      .locator('input[name=data]')
      .fill(
        new Date().toLocaleDateString('sv-SE', {
          timeZone: 'America/Sao_Paulo',
        }),
      );
    await escreverNoEditor(page, 'Leia o capítulo 2 e responda.');
    await page.getByRole('checkbox', { name: turma2.nome }).check();
    await page.getByRole('button', { name: 'Criar para 2 turmas' }).click();

    await expect(page).toHaveURL(/\/professor\/tarefas\/\d+/);
    novo.tarefaId = Number(new URL(page.url()).pathname.split('/').pop());
    await expect(
      page.getByText('A mesma tarefa também foi criada para mais 1 turma.'),
    ).toBeVisible();
    await expect(page.getByText('Leia o capítulo 2 e responda.')).toBeVisible();
  });

  test('o professor edita a tarefa já enviada', async ({ page }) => {
    const { professor } = lerEstado();
    await entrarComo(page, 'Professor', professor.email, professor.senha);
    await page.goto(`/professor/tarefas/${novo.tarefaId}`);
    await page.getByRole('link', { name: 'Editar tarefa' }).click();
    await expect(
      page.getByRole('heading', { name: 'Editar tarefa' }),
    ).toBeVisible();

    await page.locator('input[name=titulo]').fill('Leitura E2E revisada');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page).toHaveURL(/\/professor\/tarefas\/\d+$/);
    await expect(page.getByText('Tarefa atualizada.')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Leitura E2E revisada' }),
    ).toBeVisible();
  });

  test('o professor exclui uma tarefa', async ({ page }) => {
    const { professor, turma } = lerEstado();
    const token = await tokenProfessor();
    const ctx = await api<{ data: { disciplinas: { id: number }[] } }>(
      'GET',
      '/painel-professor/contexto',
      token,
    );
    const criada = await api<{ data: { id: number } }>(
      'POST',
      '/painel-professor/tarefas',
      token,
      {
        titulo: 'Para apagar E2E',
        descricao: '<p>Tarefa criada por engano.</p>',
        turmaId: turma.id,
        disciplinaId: ctx.data.disciplinas[0].id,
        dataEntrega: new Date().toLocaleDateString('sv-SE', {
          timeZone: 'America/Sao_Paulo',
        }),
      },
    );

    await entrarComo(page, 'Professor', professor.email, professor.senha);
    await page.goto(`/professor/tarefas/${criada.data.id}`);
    await page.getByRole('button', { name: 'Excluir' }).click();
    await page.getByRole('button', { name: 'Sim, excluir' }).click();
    await expect(page).toHaveURL(/\/professor\/tarefas$/);
    await expect(page.getByText('Para apagar E2E')).toHaveCount(0);
  });

  test('o aluno abre a tarefa pela Agenda, responde e volta para a Agenda', async ({
    page,
  }) => {
    await entrarComo(page, 'Aluno', novo.aluno.email, senha);
    await page.goto('/aluno/agenda');
    await page.getByText('Leitura E2E revisada').first().click();
    await expect(page).toHaveURL(/\/aluno\/tarefas\/\d+/);

    await page.getByRole('button', { name: 'Escrever resposta' }).click();
    await escreverNoEditor(page, 'O capítulo fala sobre amizade.');
    await page.getByRole('button', { name: 'Enviar resposta' }).click();
    await expect(
      page.getByText('Resposta enviada para a professora!'),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Voltar' }).first().click();
    await expect(page).toHaveURL(/\/aluno\/agenda$/);
  });

  test('o professor vê a resposta do aluno', async ({ page }) => {
    const { professor } = lerEstado();
    await entrarComo(page, 'Professor', professor.email, professor.senha);
    await page.goto(`/professor/tarefas/${novo.tarefaId}`);
    const linha = page.locator('.entregas li', { hasText: novo.aluno.nome });
    await linha.getByRole('button', { name: 'Ver resposta' }).click();
    await expect(
      linha.getByText('O capítulo fala sobre amizade.'),
    ).toBeVisible();
  });

  test('o aviso do professor chega para o aluno e para a família', async ({
    page,
  }) => {
    const { turma } = lerEstado();
    await api('POST', '/painel-professor/comunicados', await tokenProfessor(), {
      turmaId: turma.id,
      tipo: 'evento',
      titulo: 'Passeio E2E',
      mensagem: '<p>Passeio ao museu na <strong>sexta-feira</strong>.</p>',
      simplificada: false,
      rascunho: false,
    });

    await entrarComo(page, 'Aluno', novo.aluno.email, senha);
    await page.goto('/aluno/avisos');
    const aviso = page.locator('.aviso', { hasText: 'Passeio E2E' });
    await expect(aviso.getByText('Novo')).toBeVisible();
    await expect(
      aviso.locator('strong', { hasText: 'sexta-feira' }),
    ).toBeVisible();
    await aviso.getByRole('button', { name: 'Já li' }).click();
    await expect(aviso.getByText('Novo')).toHaveCount(0);

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await entrarComo(page, 'Família', novo.familia.email, novo.familia.senha);
    await page.getByRole('button', { name: 'Manter a senha recebida' }).click();
    await page.getByLabel(/Li e concordo/).check();
    await page.getByRole('button', { name: 'Aceitar e continuar' }).click();
    await page.goto('/familia/avisos');
    await expect(page.getByText('Passeio E2E')).toBeVisible();
  });

  test('a família vê as tarefas a fazer e a resposta entregue', async ({
    page,
  }) => {
    await entrarComo(page, 'Família', novo.familia.email, novo.familia.senha);
    await page.goto('/familia/tarefas');
    await expect(page.getByRole('heading', { name: 'Tarefas' })).toBeVisible();
    const aFazer = page.locator('.coluna', { hasText: 'A FAZER' });
    const item = aFazer.locator('li', { hasText: 'Leitura E2E revisada' });
    await expect(item).toBeVisible();
    await expect(item.getByText(/Resposta entregue em/)).toBeVisible();
  });

  test('trocar de turma leva as tarefas da turma nova', async () => {
    // A tarefa respondida fica (o trabalho entregue nao se perde).
    const { escola, turma2, tarefa } = lerEstado();
    const tokenEscola = await entrar(escola.email, escola.senha);
    const tokenAluno = await entrar(novo.aluno.email, senha);
    type Resumo = { data: { tarefas: { id: number; titulo: string }[] } };
    const antes = await api<Resumo>('GET', '/painel-aluno/resumo', tokenAluno);
    expect(antes.data.tarefas.map((t) => t.id)).toContain(tarefa.id);

    await api(
      'POST',
      `/painel-escola/turmas/${turma2.id}/alunos`,
      tokenEscola,
      {
        alunoIds: [novo.alunoId],
      },
    );

    const depois = await api<Resumo>('GET', '/painel-aluno/resumo', tokenAluno);
    const titulos = depois.data.tarefas.map((t) => t.titulo);
    // A pendente da turma antiga sai; a copia da turma nova entra.
    expect(depois.data.tarefas.map((t) => t.id)).not.toContain(tarefa.id);
    expect(titulos).toContain('Leitura E2E');
    expect(titulos).toContain('Leitura E2E revisada');
  });
});

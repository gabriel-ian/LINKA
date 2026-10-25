import { expect, test } from '@playwright/test';
import { lerEstado } from '../api';
import { entrarComo } from './fluxos';

test.describe.serial('LGPD', () => {
  test('a família aceita o termo no primeiro acesso', async ({ page }) => {
    const { familia } = lerEstado();
    await entrarComo(page, 'Família', familia.email, familia.senha);
    await page.getByRole('button', { name: 'Manter a senha recebida' }).click();
    await expect(page).toHaveURL(/\/familia/);

    await expect(
      page.getByText('Antes de começar: privacidade e uso dos dados'),
    ).toBeVisible();
    const aceitar = page.getByRole('button', { name: 'Aceitar e continuar' });
    await expect(aceitar).toBeDisabled();
    await page.getByLabel(/Li e concordo/).check();
    await aceitar.click();
    await expect(
      page.getByRole('heading', { name: 'Painel familiar' }),
    ).toBeVisible();

    // Aceite gravado: na proxima entrada o termo nao aparece de novo.
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Painel familiar' }),
    ).toBeVisible();
  });

  test('a família baixa os dados do filho e pede a exclusão', async ({
    page,
  }) => {
    const { familia, alunoComFamilia } = lerEstado();
    await entrarComo(page, 'Família', familia.email, familia.senha);
    await page.goto('/familia/configuracoes');

    const item = page.locator('.dados-filhos li', {
      hasText: alunoComFamilia.nome,
    });
    // O Edge controlado pelo Playwright fecha o navegador depois de um download
    // de verdade; o teste guarda o nome do arquivo pedido e le os dados da API.
    await page.evaluate(() => {
      const w = window as unknown as { baixados: string[] };
      w.baixados = [];
      HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        if (this.download) w.baixados.push(this.download);
      };
    });
    const [resposta] = await Promise.all([
      page.waitForResponse((r) =>
        r.url().endsWith(`/filhos/${alunoComFamilia.id}/dados`),
      ),
      item.getByRole('button', { name: 'Baixar dados' }).click(),
    ]);
    const dados = (await resposta.json()).data;
    expect(dados.aluno.nome).toBe(alunoComFamilia.nome);
    expect(dados.diagnosticos.length).toBeGreaterThan(0);
    expect(dados.acessosAoLaudo[0].acao).toBe('envio');
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { baixados: string[] }).baixados,
        ),
      )
      .toEqual(['dados-davi-com-familia-e2e.json']);

    await item.getByRole('button', { name: 'Pedir exclusão' }).click();
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Pedir a exclusão' })
      .click();
    await expect(item.getByText('Pedido enviado')).toBeVisible();
  });

  test('a escola vê o pedido e o histórico do laudo e apaga os dados', async ({
    page,
  }) => {
    const { escola, alunoComFamilia } = lerEstado();
    await entrarComo(page, 'Escola', escola.email, escola.senha);
    await page.goto(`/escola/alunos/${alunoComFamilia.id}`);

    await expect(
      page.getByText(/pediu a exclusão dos dados deste aluno/),
    ).toBeVisible();
    await expect(page.getByText(/Enviado por escola\./)).toBeVisible();

    await page.getByRole('button', { name: 'Apagar dados do aluno' }).click();
    const janela = page.getByRole('dialog');
    const confirmar = janela.getByRole('button', { name: 'Apagar dados' });
    await expect(confirmar).toBeDisabled();
    await janela.locator('input[name=confirmacao]').fill(alunoComFamilia.nome);
    await confirmar.click();

    await expect(page).toHaveURL(/\/escola\/alunos\?apagado=1/);
    await expect(page.getByText('Dados do aluno apagados')).toBeVisible();
    await expect(page.getByText(alunoComFamilia.nome)).toHaveCount(0);
  });

  test('depois da exclusão, a família não vê mais o filho', async ({
    page,
  }) => {
    const { familia } = lerEstado();
    await entrarComo(page, 'Família', familia.email, familia.senha);
    await expect(page.getByText('Nenhum filho vinculado ainda')).toBeVisible();
  });
});

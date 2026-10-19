import { config } from 'dotenv';
import { join } from 'path';
import { createConnection } from 'mysql2/promise';

/**
 * Apaga de vez as escolas de teste ("Escola E2E ...") e tudo o que elas
 * criaram. Le a conexao do backend/.env (ou das variaveis DB_* da CI).
 * Nunca toca em escolas com outro nome.
 *
 *   npx ts-node limpar.ts      (tambem roda sozinho no fim dos testes)
 */
export async function limparEscolasDeTeste(): Promise<number> {
  config({ path: join(__dirname, '..', 'backend', '.env') });
  const c = await createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  try {
    const [escolas] = await c.query<any[]>(
      "SELECT id FROM escola WHERE nome LIKE 'Escola E2E %'",
    );
    const ids = escolas.map((e) => e.id);
    if (!ids.length) return 0;

    const ids_ = async (sql: string) =>
      ((await c.query<any[]>(sql, [ids]))[0] as { id: number }[]).map((r) => r.id);
    const alunos = await ids_('SELECT id FROM aluno WHERE escola_id IN (?)');
    const turmas = await ids_('SELECT id FROM turma WHERE escola_id IN (?)');
    const professores = await ids_('SELECT id FROM professor WHERE escola_id IN (?)');
    const responsaveis = await ids_('SELECT id FROM responsavel WHERE escola_id IN (?)');
    const tarefas = turmas.length
      ? ((await c.query<any[]>('SELECT id FROM tarefa WHERE turma_id IN (?)', [turmas]))[0] as {
          id: number;
        }[]).map((r) => r.id)
      : [];
    const comunicados = await ids_('SELECT id FROM comunicado WHERE escola_id IN (?)');
    const usuarios = [
      ...(await ids_('SELECT id FROM usuario WHERE escola_id IN (?)')),
      ...(responsaveis.length
        ? ((await c.query<any[]>('SELECT usuario_id id FROM responsavel WHERE id IN (?)', [
            responsaveis,
          ]))[0] as { id: number | null }[])
            .map((r) => r.id)
            .filter((id): id is number => id !== null)
        : []),
    ];

    const apagar = async (tabela: string, coluna: string, lista: number[]) => {
      if (lista.length) await c.query(`DELETE FROM ${tabela} WHERE ${coluna} IN (?)`, [lista]);
    };

    await c.beginTransaction();
    for (const t of ['tarefa_status', 'tarefa_adaptada', 'pedido_ajuda', 'incentivo'])
      await apagar(t, 'tarefa_id', tarefas);
    for (const t of [
      'tarefa_status',
      'tarefa_adaptada',
      'pedido_ajuda',
      'incentivo',
      'matricula',
      'aluno_neurodivergencia',
      'aluno_responsavel',
      'aluno_lembrete',
    ])
      await apagar(t, 'aluno_id', alunos);
    await apagar('notificacao_enviada', 'responsavel_id', responsaveis);
    await apagar('comunicado_leitura', 'comunicado_id', comunicados);
    await apagar('comunicado', 'id', comunicados);
    await apagar('tarefa', 'id', tarefas);
    await apagar('turma_professor_disciplina', 'turma_id', turmas);
    await apagar('professor_disciplina', 'professor_id', professores);
    await apagar('turma', 'id', turmas);
    await apagar('aluno', 'id', alunos);
    await apagar('professor', 'id', professores);
    await apagar('responsavel', 'id', responsaveis);
    await apagar('usuario', 'id', usuarios);
    await apagar('escola', 'id', ids);
    await c.commit();
    return ids.length;
  } catch (erro) {
    await c.rollback().catch(() => undefined);
    throw erro;
  } finally {
    await c.end();
  }
}

if (require.main === module) {
  limparEscolasDeTeste()
    .then((n) => console.log(`Escolas de teste apagadas: ${n}`))
    .catch((e: unknown) => {
      console.error(e);
      process.exit(1);
    });
}

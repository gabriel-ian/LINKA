/**
 * Carga de dados de teste: familias e alunos ficticios gerados com Faker.
 *
 *   npm run seed:faker                     -> 150 alunos na escola 1
 *   npm run seed:faker -- --alunos=200 --escola=1
 *   npm run seed:faker -- --limpar         -> apaga tudo o que a carga criou
 *
 * Tudo fica marcado pelo dominio de e-mail @seed.linka.dev (logins das
 * familias), entao a limpeza nunca toca em dados reais. As familias entram
 * com a senha "linka123" (sem senha provisoria) para facilitar os testes.
 * Alguns irmaos dividem a mesma familia e ~12% dos alunos ficam sem turma,
 * para testar "Adicionar alunos" na turma.
 */
import 'dotenv/config';
import { fakerPT_BR as faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';
import { createConnection, Connection, RowDataPacket } from 'mysql2/promise';

const DOMINIO = 'seed.linka.dev';
const SENHA = 'linka123';
const SERIES = ['6º Ano', '7º Ano', '8º Ano', '9º Ano'];
const LETRAS = ['A', 'B'];
const LIMITE_TURMA = 30;
const PARENTESCOS: [string, 'female' | 'male'][] = [
  ['Mãe', 'female'],
  ['Mãe', 'female'],
  ['Mãe', 'female'],
  ['Pai', 'male'],
  ['Pai', 'male'],
  ['Avó', 'female'],
  ['Avô', 'male'],
  ['Tia', 'female'],
  ['Responsável legal', 'female'],
];
const INTERESSES = [
  'Dinossauros',
  'Futebol',
  'Games',
  'Desenho',
  'Música',
  'Animais',
  'Espaço',
  'Robôs',
  'Dança',
  'Lego',
  'Carros',
  'Natureza',
];

function argumento(nome: string, padrao: string): string {
  const achado = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return achado ? achado.split('=')[1] : padrao;
}

/** "José da Silva" -> "jose.silva" para o e-mail. */
function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')
    .replace(/^\.|\.$/g, '');
}

function telefone(): string {
  const ddd = faker.helpers.arrayElement(['41', '42', '43', '44', '45', '46']);
  return `(${ddd}) 9${faker.string.numeric(4)}-${faker.string.numeric(4)}`;
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function conectar(): Promise<Connection> {
  return createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

async function linhas<T>(
  c: Connection,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [r] = await c.query<RowDataPacket[]>(sql, params);
  return r as T[];
}

async function limpar(c: Connection): Promise<void> {
  const alunos = (
    await linhas<{ id: number }>(
      c,
      `SELECT DISTINCT ar.aluno_id id FROM aluno_responsavel ar
         JOIN responsavel r ON r.id = ar.responsavel_id
         JOIN usuario u ON u.id = r.usuario_id
        WHERE u.email LIKE ?`,
      [`%@${DOMINIO}`],
    )
  ).map((a) => a.id);

  if (alunos.length) {
    for (const tabela of [
      'tarefa_status',
      'tarefa_adaptada',
      'matricula',
      'aluno_neurodivergencia',
      'aluno_responsavel',
      'aluno_lembrete',
      'incentivo',
      'pedido_ajuda',
    ])
      await c.query(`DELETE FROM ${tabela} WHERE aluno_id IN (?)`, [alunos]);
    await c.query('DELETE FROM aluno WHERE id IN (?)', [alunos]);
  }

  await c.query(
    `DELETE cl FROM comunicado_leitura cl
       JOIN responsavel r ON r.id = cl.responsavel_id
       JOIN usuario u ON u.id = r.usuario_id WHERE u.email LIKE ?`,
    [`%@${DOMINIO}`],
  );
  const [resp] = await c.query(
    `DELETE r FROM responsavel r JOIN usuario u ON u.id = r.usuario_id
      WHERE u.email LIKE ?`,
    [`%@${DOMINIO}`],
  );
  const [usu] = await c.query('DELETE FROM usuario WHERE email LIKE ?', [
    `%@${DOMINIO}`,
  ]);

  // Turmas que a carga criou (sala "... (carga)") e ficaram vazias e sem uso.
  const [tur] = await c.query(
    `DELETE t FROM turma t
      WHERE t.sala LIKE '% (carga)'
        AND NOT EXISTS (SELECT 1 FROM matricula m WHERE m.turma_id = t.id)
        AND NOT EXISTS (SELECT 1 FROM tarefa x WHERE x.turma_id = t.id)
        AND NOT EXISTS (SELECT 1 FROM comunicado x WHERE x.turma_id = t.id)
        AND NOT EXISTS (SELECT 1 FROM turma_professor_disciplina x WHERE x.turma_id = t.id)`,
  );

  console.log(
    `Removidos: ${alunos.length} alunos, ${(resp as { affectedRows: number }).affectedRows} familias, ` +
      `${(usu as { affectedRows: number }).affectedRows} logins, ` +
      `${(tur as { affectedRows: number }).affectedRows} turmas vazias da carga.`,
  );
}

async function semear(c: Connection, escolaId: number, total: number) {
  const [escola] = await linhas<{ id: number; nome: string }>(
    c,
    'SELECT id, nome FROM escola WHERE id = ?',
    [escolaId],
  );
  if (!escola) throw new Error(`Escola ${escolaId} nao existe`);

  const ano = new Date().getFullYear();
  const turmas: {
    id: number;
    serie: string;
    ocupadas: number;
    limite: number;
  }[] = [];
  let sala = 101;
  for (const [i, serie] of SERIES.entries()) {
    for (const letra of LETRAS) {
      const nome = `${serie} ${letra}`;
      const [existe] = await linhas<{
        id: number;
        limite: number | null;
        ocupadas: number;
      }>(
        c,
        `SELECT t.id, t.limite_alunos limite,
                (SELECT COUNT(*) FROM matricula m WHERE m.turma_id = t.id) ocupadas
           FROM turma t WHERE t.escola_id = ? AND t.nome = ? AND t.ano_letivo = ?`,
        [escolaId, nome, ano],
      );
      if (existe) {
        turmas.push({
          id: existe.id,
          serie,
          ocupadas: Number(existe.ocupadas),
          limite: existe.limite ?? Infinity,
        });
        continue;
      }
      const [r] = await c.query(
        `INSERT INTO turma (nome, serie, letra, turno, ano_letivo, sala, limite_alunos, escola_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          nome,
          serie,
          letra,
          i % 2 ? 'tarde' : 'manha',
          ano,
          `Sala ${sala++} (carga)`,
          LIMITE_TURMA,
          escolaId,
        ],
      );
      turmas.push({
        id: (r as { insertId: number }).insertId,
        serie,
        ocupadas: 0,
        limite: LIMITE_TURMA,
      });
    }
  }

  const diagnosticos = await linhas<{ id: number }>(
    c,
    'SELECT id FROM neurodivergencia',
  );
  const hash = await bcrypt.hash(SENHA, 10);
  const cgms = new Set(
    (
      await linhas<{ cgm: string }>(
        c,
        'SELECT cgm FROM aluno WHERE cgm IS NOT NULL',
      )
    ).map((a) => a.cgm),
  );

  let alunos = 0;
  let familias = 0;
  let semTurma = 0;
  let nee = 0;

  await c.beginTransaction();
  try {
    while (alunos < total) {
      const filhos = Math.min(
        total - alunos,
        faker.helpers.weightedArrayElement([
          { value: 1, weight: 70 },
          { value: 2, weight: 25 },
          { value: 3, weight: 5 },
        ]),
      );
      const sobrenome = faker.person.lastName();
      const [parentesco, sexo] = faker.helpers.arrayElement(PARENTESCOS);
      const primeiro = faker.person.firstName(sexo);
      const nomeResp = `${primeiro} ${faker.person.lastName()} ${sobrenome}`;
      const email = `${slug(primeiro)}.${slug(sobrenome)}.${familias + 1}@${DOMINIO}`;

      const [u] = await c.query(
        `INSERT INTO usuario (email, senha, senha_provisoria, perfil, escola_id, ativo)
         VALUES (?, ?, 0, 'responsavel', NULL, 1)`,
        [email, hash],
      );
      const [r] = await c.query(
        `INSERT INTO responsavel (nome_completo, telefone, parentesco, usuario_id, escola_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          nomeResp,
          telefone(),
          parentesco,
          (u as { insertId: number }).insertId,
          escolaId,
        ],
      );
      const responsavelId = (r as { insertId: number }).insertId;
      familias++;

      for (let f = 0; f < filhos; f++) {
        // ~12% sem turma; os outros numa serie com vaga.
        const comVaga = turmas.filter((t) => t.ocupadas < t.limite);
        const turma =
          faker.number.int(100) < 12 || !comVaga.length
            ? null
            : faker.helpers.arrayElement(comVaga);
        const serie = turma?.serie ?? faker.helpers.arrayElement(SERIES);
        const idade = 11 + SERIES.indexOf(serie);
        const nascimento = faker.date.birthdate({
          mode: 'age',
          min: idade,
          max: idade,
        });

        let cgm: string;
        do cgm = faker.string.numeric({ length: 7, allowLeadingZeros: false });
        while (cgms.has(cgm));
        cgms.add(cgm);

        const ehNee = faker.number.int(100) < 30;
        const diag = ehNee
          ? faker.number.int(100) < 8
            ? []
            : faker.helpers.arrayElements(diagnosticos, { min: 1, max: 2 })
          : [];
        const interesses = ehNee
          ? faker.helpers
              .arrayElements(INTERESSES, { min: 1, max: 3 })
              .join(', ')
          : null;

        const [a] = await c.query(
          `INSERT INTO aluno (nome_completo, data_nascimento, cgm, escola_id, neurodivergente, interesses, ativo)
           VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            `${faker.person.firstName()} ${sobrenome}`,
            iso(nascimento),
            cgm,
            escolaId,
            ehNee ? 1 : 0,
            interesses,
          ],
        );
        const alunoId = (a as { insertId: number }).insertId;
        if (ehNee) nee++;

        for (const d of diag)
          await c.query(
            'INSERT INTO aluno_neurodivergencia (aluno_id, neurodivergencia_id) VALUES (?, ?)',
            [alunoId, d.id],
          );
        await c.query(
          'INSERT INTO aluno_responsavel (aluno_id, responsavel_id) VALUES (?, ?)',
          [alunoId, responsavelId],
        );

        if (turma) {
          await c.query(
            'INSERT INTO matricula (aluno_id, turma_id) VALUES (?, ?)',
            [alunoId, turma.id],
          );
          turma.ocupadas++;
          // Mesma regra do cadastro: so as tarefas que ainda vao vencer.
          await c.query(
            `INSERT IGNORE INTO tarefa_status (aluno_id, tarefa_id)
             SELECT ?, t.id FROM tarefa t
              WHERE t.turma_id = ? AND (t.data_entrega IS NULL OR t.data_entrega >= CURDATE())`,
            [alunoId, turma.id],
          );
        } else semTurma++;
        alunos++;
      }
    }
    await c.commit();
  } catch (erro) {
    await c.rollback();
    throw erro;
  }

  console.log(
    `Escola ${escola.nome}: ${alunos} alunos (${nee} com NEE, ${semTurma} sem turma) ` +
      `em ${familias} familias. Login das familias: e-mail @${DOMINIO}, senha ${SENHA}.`,
  );
}

async function main(): Promise<void> {
  const c = await conectar();
  try {
    if (process.argv.includes('--limpar')) await limpar(c);
    else
      await semear(
        c,
        Number(argumento('escola', '1')),
        Number(argumento('alunos', '150')),
      );
  } finally {
    await c.end();
  }
}

main().catch((erro: unknown) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exit(1);
});

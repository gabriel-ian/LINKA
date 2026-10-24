import { writeFileSync } from 'fs';
import { ADMIN, API, ARQUIVO_ESTADO, Estado, api, entrar } from './api';

/**
 * Cria uma escola so para esta execucao, com uma turma, um professor, um
 * aluno com login (na turma), um aluno sem turma e uma tarefa para hoje.
 * Os dados reais do banco nao sao tocados.
 */
export default async function globalSetup(): Promise<void> {
  const marca = Date.now();
  const dominio = 'e2e.linka.dev';
  const senha = 'SenhaE2e123';
  const ano = new Date().getFullYear();

  const adm = await entrar(ADMIN.email, ADMIN.senha);
  const escola = {
    nome: `Escola E2E ${marca}`,
    email: `escola.${marca}@${dominio}`,
    senha,
  };
  const criada = await api<{ data: { id: number } }>(
    'POST',
    '/admin/escolas',
    adm,
    escola,
  );
  const tokenEscola = await entrar(escola.email, senha);
  // Primeiro acesso da escola: segue com a senha recebida.
  await api('POST', '/auth/senha/manter', tokenEscola, {});

  const turma = await api<{ data: { id: number; nome: string } }>(
    'POST',
    '/painel-escola/turmas',
    tokenEscola,
    {
      serie: '6º Ano',
      letra: 'E',
      turno: 'manha',
      anoLetivo: ano,
      limiteAlunos: 30,
    },
  );

  // Segunda turma do mesmo professor: copiar tarefa e trocar aluno de turma.
  const turma2 = await api<{ data: { id: number; nome: string } }>(
    'POST',
    '/painel-escola/turmas',
    tokenEscola,
    {
      serie: '6º Ano',
      letra: 'F',
      turno: 'manha',
      anoLetivo: ano,
      limiteAlunos: 30,
    },
  );

  const professor = { email: `prof.${marca}@${dominio}`, senha };
  await api('POST', '/painel-escola/professores', tokenEscola, {
    nomeCompleto: 'Paula Professora E2E',
    ...professor,
    disciplinas: ['Matemática'],
    turmaIds: [turma.data.id, turma2.data.id],
  });

  const aluno = {
    nome: 'Bruno Aluno E2E',
    email: `aluno.${marca}@${dominio}`,
    senha,
  };
  const alunoCriado = await api<{ data: { id: number } }>(
    'POST',
    '/painel-escola/alunos',
    tokenEscola,
    {
      nomeCompleto: aluno.nome,
      email: aluno.email,
      senha,
      turmaId: turma.data.id,
      cgm: `E2E${marca}`.slice(0, 15),
    },
  );
  const semTurma = await api<{ data: { id: number; nome: string } }>(
    'POST',
    '/painel-escola/alunos',
    tokenEscola,
    { nomeCompleto: 'Carla Sem Turma E2E' },
  );

  // Aluno com familia (login com senha provisoria) e um laudo anexado.
  const familia = { email: `familia.${marca}@${dominio}` };
  const opcoes = await api<{ data: { diagnosticos: { id: number }[] } }>(
    'GET',
    '/painel-escola/opcoes',
    tokenEscola,
  );
  const comFamilia = await api<{
    data: { id: number; responsavel: { senhaProvisoria: string } };
  }>('POST', '/painel-escola/alunos', tokenEscola, {
    nomeCompleto: 'Davi Com Familia E2E',
    turmaId: turma.data.id,
    diagnosticoIds: [opcoes.data.diagnosticos[0].id],
    responsavel: {
      nomeCompleto: 'Helena Familia E2E',
      email: familia.email,
      parentesco: 'Mãe',
    },
  });
  // Basta comecar com "%PDF": o backend confere o tipo pelos primeiros bytes.
  const pdf = new Blob([Buffer.from('%PDF-1.4 laudo de teste %%EOF')], {
    type: 'application/pdf',
  });
  const form = new FormData();
  form.append('arquivo', pdf, 'laudo.pdf');
  const envio = await fetch(
    `${API}/painel-escola/alunos/${comFamilia.data.id}/laudo`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenEscola}` },
      body: form,
    },
  );
  if (!envio.ok)
    throw new Error(`laudo: ${envio.status} ${await envio.text()}`);

  // O professor cria uma tarefa para hoje na turma.
  const tokenProf = await entrar(professor.email, senha);
  await api('POST', '/auth/senha/manter', tokenProf, {});
  const contexto = await api<{ data: { disciplinas: { id: number }[] } }>(
    'GET',
    '/painel-professor/contexto',
    tokenProf,
  );
  const hoje = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'America/Sao_Paulo',
  });
  const tarefa = await api<{ data: { id: number } }>(
    'POST',
    '/painel-professor/tarefas',
    tokenProf,
    {
      titulo: 'Frações E2E',
      descricao: 'Resolva os exercícios 1 a 3 da página 20.',
      turmaId: turma.data.id,
      disciplinaId: contexto.data.disciplinas[0].id,
      dataEntrega: hoje,
    },
  );

  // Uma segunda escola com um aluno, para o teste de isolamento entre escolas
  // (o nome tambem comeca com "Escola E2E", entao a limpeza apaga as duas).
  const outra = {
    nome: `Escola E2E Outra ${marca}`,
    email: `outra.${marca}@${dominio}`,
    senha,
  };
  await api('POST', '/admin/escolas', adm, outra);
  const tokenOutra = await entrar(outra.email, senha);
  await api('POST', '/auth/senha/manter', tokenOutra, {});
  const alunoOutra = await api<{ data: { id: number } }>(
    'POST',
    '/painel-escola/alunos',
    tokenOutra,
    { nomeCompleto: 'Aluno De Outra Escola E2E' },
  );

  const estado: Estado = {
    escola: { id: criada.data.id, ...escola },
    turma: turma.data,
    turma2: turma2.data,
    professor,
    aluno: { id: alunoCriado.data.id, ...aluno },
    alunoSemTurma: { id: semTurma.data.id, nome: 'Carla Sem Turma E2E' },
    tarefa: { id: tarefa.data.id, titulo: 'Frações E2E' },
    alunoComFamilia: { id: comFamilia.data.id, nome: 'Davi Com Familia E2E' },
    familia: {
      email: familia.email,
      senha: comFamilia.data.responsavel.senhaProvisoria,
    },
    alunoDeOutraEscola: { id: alunoOutra.data.id },
  };
  writeFileSync(ARQUIVO_ESTADO, JSON.stringify(estado, null, 2));
}

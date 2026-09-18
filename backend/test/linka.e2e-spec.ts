import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { Usuario } from '../src/usuario/usuario.entity';
import { Aluno } from '../src/aluno/aluno.entity';
import { Turma } from '../src/turma/turma.entity';
import { Matricula } from '../src/matricula/matricula.entity';
import { Professor } from '../src/professor/professor.entity';

/**
 * Testes de ponta a ponta contra o MySQL real (bancolinka) — sem mocks de
 * banco, de proposito, conforme documentado no APLICAR.md.
 *
 * Pre-requisitos (ver APLICAR.md):
 *  - backend/.env configurado apontando para o bancolinka local;
 *  - backend/sql/seed-admin.sql ja aplicado, criando admin@linka.com e
 *    escola@linka.com (senha linka123 nos dois).
 *
 * Os dados criados aqui (aluno/turma/professor de teste) sao removidos
 * no afterAll, entao rodar a suite varias vezes nao acumula lixo no banco.
 */

// Conexao real com MySQL + duas chamadas HTTP de login no beforeAll: o
// timeout padrao de 5s do Jest e curto demais para isso em maquina ocupada.
jest.setTimeout(30_000);

describe('Linka API (e2e)', () => {
  let app: INestApplication<App>;

  let alunoRepository: Repository<Aluno>;
  let turmaRepository: Repository<Turma>;
  let matriculaRepository: Repository<Matricula>;
  let usuarioRepository: Repository<Usuario>;
  let professorRepository: Repository<Professor>;

  let tokenAdmin: string;
  let tokenEscola: string;

  let alunoId!: number;
  let turmaId!: number;

  // Sufixo unico por execucao: reexecutar a suite nao esbarra em
  // "email/turma ja existe" nem depende de limpeza manual entre rodadas.
  const sufixo = Date.now();
  const emailProfessorTeste = `professor.e2e.${sufixo}@linka.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Replica o bootstrap de src/main.ts: sem isso, forbidNonWhitelisted
    // (usado no teste de login com "perfil") nunca entraria em vigor.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    alunoRepository = moduleFixture.get(getRepositoryToken(Aluno));
    turmaRepository = moduleFixture.get(getRepositoryToken(Turma));
    matriculaRepository = moduleFixture.get(getRepositoryToken(Matricula));
    usuarioRepository = moduleFixture.get(getRepositoryToken(Usuario));
    professorRepository = moduleFixture.get(getRepositoryToken(Professor));

    const loginAdmin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@linka.com', senha: 'linka123' })
      .expect(201);
    tokenAdmin = loginAdmin.body.access_token as string;

    const loginEscola = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'escola@linka.com', senha: 'linka123' })
      .expect(201);
    tokenEscola = loginEscola.body.access_token as string;
  });

  afterAll(async () => {
    try {
      // Ordem importa por causa das foreign keys: matricula antes de
      // aluno/turma, e professor antes do usuario que ele referencia.
      if (alunoId && turmaId) {
        await matriculaRepository.delete({ alunoId, turmaId });
      }
      if (alunoId) await alunoRepository.delete(alunoId);
      if (turmaId) await turmaRepository.delete(turmaId);

      const usuarioProfessor = await usuarioRepository.findOne({
        where: { email: emailProfessorTeste },
      });
      if (usuarioProfessor) {
        await professorRepository.delete({ usuarioId: usuarioProfessor.id });
        await usuarioRepository.delete(usuarioProfessor.id);
      }
    } finally {
      await app.close();
    }
  });

  describe('POST /auth/login', () => {
    it('autentica e devolve access_token, perfil e escolaId resolvidos pelo banco', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@linka.com', senha: 'linka123' })
        .expect(201);

      expect(res.body.access_token).toEqual(expect.any(String));
      expect(res.body.perfil).toBe('admin');
      expect(res.body.escolaId).toBeNull();
    });

    it('devolve 401 com senha errada', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@linka.com', senha: 'senha-errada' })
        .expect(401);
    });

    it('devolve 400 se o cliente tentar enviar perfil (quem decide e o banco)', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@linka.com',
          senha: 'linka123',
          perfil: 'admin',
        })
        .expect(400);
    });
  });

  describe('Autorizacao por perfil (RolesGuard)', () => {
    it('admin acessa /admin/escolas', () => {
      return request(app.getHttpServer())
        .get('/admin/escolas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);
    });

    it('perfil escola recebe 403 em /admin/escolas (exclusivo do admin)', () => {
      return request(app.getHttpServer())
        .get('/admin/escolas')
        .set('Authorization', `Bearer ${tokenEscola}`)
        .expect(403);
    });

    it('escola ve a propria escola em /escolas/me pelo escolaId do token', async () => {
      const res = await request(app.getHttpServer())
        .get('/escolas/me')
        .set('Authorization', `Bearer ${tokenEscola}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('id');
    });
  });

  describe('Cadastro de aluno, turma e professor', () => {
    it('cadastra aluno na escola logada', async () => {
      const res = await request(app.getHttpServer())
        .post('/alunos')
        .set('Authorization', `Bearer ${tokenEscola}`)
        .send({ nomeCompleto: `Aluno E2E ${sufixo}` })
        .expect(201);

      alunoId = res.body.data.id as number;
      expect(alunoId).toEqual(expect.any(Number));
    });

    it('cadastra turma na escola logada', async () => {
      const res = await request(app.getHttpServer())
        .post('/turmas')
        .set('Authorization', `Bearer ${tokenEscola}`)
        .send({ nome: `Turma E2E ${sufixo}` })
        .expect(201);

      turmaId = res.body.data.id as number;
      expect(turmaId).toEqual(expect.any(Number));
    });

    it('cadastra professor criando usuario e professor juntos, sem devolver a senha', async () => {
      const res = await request(app.getHttpServer())
        .post('/professores')
        .set('Authorization', `Bearer ${tokenEscola}`)
        .send({
          nomeCompleto: 'Professor E2E',
          email: emailProfessorTeste,
          senha: '123456',
        })
        .expect(201);

      expect(res.body.data.email).toBe(emailProfessorTeste);
      expect(res.body.data).not.toHaveProperty('senha');
    });
  });

  describe('Matricula', () => {
    it('matricula o aluno na turma cadastrados acima', () => {
      return request(app.getHttpServer())
        .post('/matriculas')
        .set('Authorization', `Bearer ${tokenEscola}`)
        .send({ alunoId, turmaId })
        .expect(201);
    });

    it('rejeita matricula duplicada com 400', () => {
      return request(app.getHttpServer())
        .post('/matriculas')
        .set('Authorization', `Bearer ${tokenEscola}`)
        .send({ alunoId, turmaId })
        .expect(400);
    });
  });
});

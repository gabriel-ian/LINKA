import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { DataSource, EntityManager, In } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { Turma } from '../turma/turma.entity';
import { Professor } from '../professor/professor.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Responsavel } from '../responsavel/responsavel.entity';
import { Disciplina } from '../disciplina/disciplina.entity';
import { Neurodivergencia } from '../neurodivergencia/neurodivergencia.entity';
import { Matricula } from '../matricula/matricula.entity';
import { AlunoNeurodivergencia } from '../aluno-neurodivergencia/aluno-neurodivergencia.entity';
import { ProfessorDisciplina } from '../professor-disciplina/professor-disciplina.entity';
import { TurmaProfessorDisciplina } from '../turma-professor-disciplina/turma-professor-disciplina.entity';
import { AlunoResponsavel } from '../aluno-responsavel/aluno-responsavel.entity';
import { TarefaStatusService } from '../tarefa-status/tarefa-status.service';
import {
  AtualizarProfessorDto,
  CriarAlunoDto,
  CriarProfessorDto,
  CriarTurmaDto,
} from './dto/cadastros.dto';

export const PASTA_LAUDOS = join(process.cwd(), 'uploads', 'laudos');
export const LAUDO_TAMANHO_MAXIMO = 10 * 1024 * 1024;

/** Tipos aceitos para laudo, conferidos pelos primeiros bytes do arquivo. */
const TIPOS_LAUDO = [
  { ext: '.pdf', mime: 'application/pdf', assinatura: [0x25, 0x50, 0x44, 0x46] },
  { ext: '.png', mime: 'image/png', assinatura: [0x89, 0x50, 0x4e, 0x47] },
  { ext: '.jpg', mime: 'image/jpeg', assinatura: [0xff, 0xd8, 0xff] },
];

/** Sem caracteres que se confundem ao ditar (0/O, 1/l/I). */
const ALFABETO_SENHA = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function gerarSenhaProvisoria(tamanho = 10): string {
  return Array.from({ length: tamanho }, () => ALFABETO_SENHA[randomInt(ALFABETO_SENHA.length)]).join('');
}

/** Escritas do painel da escola. Sempre dentro do escolaId do token. */
@Injectable()
export class CadastrosEscolaService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tarefaStatusService: TarefaStatusService,
  ) {}

  // ---------------------------------------------------------------- turma

  async criarTurma(dto: CriarTurmaDto, escolaId: number) {
    const letra = dto.letra.toUpperCase();
    const nome = `${dto.serie.trim()} ${letra}`;

    return this.dataSource.transaction(async (manager) => {
      const turmaRepo = manager.getRepository(Turma);

      if (await turmaRepo.findOne({ where: { escolaId, nome, anoLetivo: dto.anoLetivo } })) {
        throw new BadRequestException(`Ja existe a turma ${nome} em ${dto.anoLetivo}`);
      }

      const professores = await this.professoresDaEscola(manager, dto.professorIds ?? [], escolaId);

      const turma = await turmaRepo.save(
        turmaRepo.create({
          nome,
          serie: dto.serie.trim(),
          letra,
          turno: dto.turno,
          anoLetivo: dto.anoLetivo,
          sala: dto.sala?.trim() || null,
          limiteAlunos: dto.limiteAlunos ?? null,
          escolaId,
        }),
      );

      for (const professor of professores) {
        const disciplinaIds = await this.disciplinasDoProfessor(manager, professor.id);
        await this.alocar(manager, [turma.id], professor.id, disciplinaIds);
      }

      return { data: { id: turma.id, nome: turma.nome } };
    });
  }

  // ------------------------------------------------------------ professor

  async criarProfessor(dto: CriarProfessorDto, escolaId: number) {
    return this.dataSource.transaction(async (manager) => {
      await this.garantirEmailLivre(manager, dto.email);
      const turmas = await this.turmasDaEscola(manager, dto.turmaIds ?? [], escolaId);

      const usuarioRepo = manager.getRepository(Usuario);
      const usuario = await usuarioRepo.save(
        usuarioRepo.create({
          email: dto.email,
          senha: await UsuarioService.hashSenha(dto.senha),
          perfil: 'professor',
          escolaId,
        }),
      );

      const professorRepo = manager.getRepository(Professor);
      const professor = await professorRepo.save(
        professorRepo.create({ nomeCompleto: dto.nomeCompleto.trim(), usuarioId: usuario.id, escolaId }),
      );

      const disciplinaIds = await this.disciplinasPorNome(manager, dto.disciplinas ?? []);
      if (disciplinaIds.length) {
        await manager.getRepository(ProfessorDisciplina).save(
          disciplinaIds.map((disciplinaId) => ({ professorId: professor.id, disciplinaId })),
        );
      }

      await this.alocar(manager, turmas.map((t) => t.id), professor.id, disciplinaIds);

      return { data: { id: professor.id, nome: professor.nomeCompleto, email: usuario.email } };
    });
  }

  async atualizarProfessor(professorId: number, dto: AtualizarProfessorDto, escolaId: number) {
    const professor = await this.dataSource
      .getRepository(Professor)
      .findOne({ where: { id: professorId, escolaId } });

    if (!professor) throw new NotFoundException('Professor nao encontrado');
    if (!professor.usuarioId) throw new BadRequestException('Professor sem login cadastrado');

    await this.dataSource.getRepository(Usuario).update(professor.usuarioId, { ativo: dto.ativo });

    return { data: { id: professor.id, ativo: dto.ativo } };
  }

  // ---------------------------------------------------------------- aluno

  async criarAluno(dto: CriarAlunoDto, escolaId: number) {
    return this.dataSource.transaction(async (manager) => {
      const [turma] = dto.turmaId ? await this.turmasDaEscola(manager, [dto.turmaId], escolaId) : [];

      const diagnosticoIds = dto.diagnosticoIds ?? [];
      if (diagnosticoIds.length) {
        const existentes = await manager
          .getRepository(Neurodivergencia)
          .count({ where: { id: In(diagnosticoIds) } });
        if (existentes !== diagnosticoIds.length) throw new BadRequestException('Diagnostico invalido');
      }

      const usuarioRepo = manager.getRepository(Usuario);
      let usuarioAlunoId: number | null = null;

      if (dto.email) {
        await this.garantirEmailLivre(manager, dto.email);
        const usuario = await usuarioRepo.save(
          usuarioRepo.create({
            email: dto.email,
            senha: await UsuarioService.hashSenha(dto.senha!),
            perfil: 'aluno',
            escolaId,
          }),
        );
        usuarioAlunoId = usuario.id;
      }

      const alunoRepo = manager.getRepository(Aluno);
      const aluno = await alunoRepo.save(
        alunoRepo.create({
          nomeCompleto: dto.nomeCompleto.trim(),
          data_nascimento: dto.dataNascimento?.slice(0, 10) ?? null,
          cgm: dto.cgm?.trim() || null,
          escolaId,
          usuarioId: usuarioAlunoId,
          neurodivergente: diagnosticoIds.length > 0 || !!dto.prefiroNaoInformar,
        }),
      );

      if (diagnosticoIds.length) {
        await manager
          .getRepository(AlunoNeurodivergencia)
          .save(diagnosticoIds.map((id) => ({ alunoId: aluno.id, neurodivergenciaId: id })));
      }

      if (turma) {
        await manager.getRepository(Matricula).save({ alunoId: aluno.id, turmaId: turma.id });
        await this.tarefaStatusService.seedParaAluno(aluno.id, turma.id, manager);
      }

      const responsavel = dto.responsavel
        ? await this.vincularResponsavel(manager, aluno.id, dto.responsavel)
        : null;

      return {
        data: {
          id: aluno.id,
          nome: aluno.nomeCompleto,
          turma: turma ? { id: turma.id, nome: turma.nome } : null,
          responsavel,
        },
      };
    });
  }

  /**
   * Responsavel ja existente (irmaos na escola) e so vinculado; novo
   * ganha login com senha provisoria, devolvida UMA vez para a escola repassar.
   */
  private async vincularResponsavel(
    manager: EntityManager,
    alunoId: number,
    dados: NonNullable<CriarAlunoDto['responsavel']>,
  ) {
    const usuarioRepo = manager.getRepository(Usuario);
    const responsavelRepo = manager.getRepository(Responsavel);
    let usuario = await usuarioRepo.findOne({ where: { email: dados.email } });
    let senhaProvisoria: string | null = null;

    if (usuario && usuario.perfil !== 'responsavel') {
      throw new BadRequestException('O e-mail do responsavel ja e usado por outro tipo de conta');
    }

    if (!usuario) {
      senhaProvisoria = gerarSenhaProvisoria();
      usuario = await usuarioRepo.save(
        usuarioRepo.create({
          email: dados.email,
          senha: await UsuarioService.hashSenha(senhaProvisoria),
          perfil: 'responsavel',
          escolaId: null,
        }),
      );
    }

    const responsavel =
      (await responsavelRepo.findOne({ where: { usuarioId: usuario.id } })) ??
      (await responsavelRepo.save(
        responsavelRepo.create({
          nomeCompleto: dados.nomeCompleto.trim(),
          telefone: dados.telefone?.trim() || null,
          parentesco: dados.parentesco?.trim() || null,
          usuarioId: usuario.id,
        }),
      ));

    await manager.getRepository(AlunoResponsavel).save({ alunoId, responsavelId: responsavel.id });

    return { nome: responsavel.nomeCompleto, email: dados.email, senhaProvisoria };
  }

  // ---------------------------------------------------------------- laudo

  async salvarLaudo(alunoId: number, escolaId: number, arquivo: Express.Multer.File | undefined) {
    if (!arquivo) throw new BadRequestException('Envie o arquivo do laudo');
    if (arquivo.size > LAUDO_TAMANHO_MAXIMO) throw new BadRequestException('O laudo pode ter ate 10 MB');

    const tipo = TIPOS_LAUDO.find((t) => t.assinatura.every((byte, i) => arquivo.buffer[i] === byte));
    if (!tipo) throw new BadRequestException('O laudo deve ser PDF, PNG ou JPG');

    const alunoRepo = this.dataSource.getRepository(Aluno);
    const aluno = await alunoRepo.findOne({ where: { id: alunoId, escolaId } });
    if (!aluno) throw new NotFoundException('Aluno nao encontrado');

    await fs.mkdir(PASTA_LAUDOS, { recursive: true });
    const nomeArquivo = `${aluno.id}-${Date.now()}${tipo.ext}`;
    await fs.writeFile(join(PASTA_LAUDOS, nomeArquivo), arquivo.buffer);

    if (aluno.laudo) {
      await fs.rm(join(PASTA_LAUDOS, aluno.laudo), { force: true });
    }

    await alunoRepo.update(aluno.id, { laudo: nomeArquivo, laudoEnviadoEm: new Date() });

    return { data: { enviadoEm: new Date() } };
  }

  /** Caminho do laudo para download; so a escola do aluno chega aqui. */
  async caminhoLaudo(alunoId: number, escolaId: number) {
    const aluno = await this.dataSource.getRepository(Aluno).findOne({ where: { id: alunoId, escolaId } });
    if (!aluno?.laudo) throw new NotFoundException('Laudo nao encontrado');

    const tipo = TIPOS_LAUDO.find((t) => aluno.laudo!.endsWith(t.ext))!;
    return {
      caminho: join(PASTA_LAUDOS, aluno.laudo),
      mime: tipo.mime,
      nomeDownload: `laudo-${aluno.id}${tipo.ext}`,
    };
  }

  // ------------------------------------------------------------- internos

  private async garantirEmailLivre(manager: EntityManager, email: string) {
    if (await manager.getRepository(Usuario).findOne({ where: { email } })) {
      throw new BadRequestException('Ja existe um usuario com este email');
    }
  }

  private async turmasDaEscola(manager: EntityManager, ids: number[], escolaId: number) {
    if (!ids.length) return [];
    const turmas = await manager.getRepository(Turma).find({ where: { id: In(ids), escolaId } });
    if (turmas.length !== ids.length) throw new BadRequestException('Turma invalida');
    return turmas;
  }

  private async professoresDaEscola(manager: EntityManager, ids: number[], escolaId: number) {
    if (!ids.length) return [];
    const professores = await manager.getRepository(Professor).find({ where: { id: In(ids), escolaId } });
    if (professores.length !== ids.length) throw new BadRequestException('Professor invalido');
    return professores;
  }

  private async disciplinasDoProfessor(manager: EntityManager, professorId: number): Promise<number[]> {
    const linhas: { disciplinaId: number }[] = await manager.query(
      'SELECT disciplina_id disciplinaId FROM professor_disciplina WHERE professor_id = ?',
      [professorId],
    );
    return linhas.map((l) => Number(l.disciplinaId));
  }

  /** Acha pelo nome (sem diferenciar maiusculas) ou cria a disciplina. */
  private async disciplinasPorNome(manager: EntityManager, nomes: string[]): Promise<number[]> {
    const repo = manager.getRepository(Disciplina);
    const todas = await repo.find();
    const ids: number[] = [];

    for (const bruto of nomes) {
      const nome = bruto.trim();
      if (!nome) continue;
      let disciplina = todas.find((d) => d.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'));
      if (!disciplina) {
        disciplina = await repo.save(repo.create({ nome }));
        todas.push(disciplina);
      }
      if (!ids.includes(disciplina.id)) ids.push(disciplina.id);
    }

    return ids;
  }

  /** Uma linha turma x professor x disciplina (ou sem disciplina). */
  private async alocar(manager: EntityManager, turmaIds: number[], professorId: number, disciplinaIds: number[]) {
    const linhas = turmaIds.flatMap((turmaId) =>
      (disciplinaIds.length ? disciplinaIds : [null]).map((disciplinaId) => ({
        turmaId,
        professorId,
        disciplinaId,
      })),
    );

    if (linhas.length) {
      await manager.getRepository(TurmaProfessorDisciplina).save(linhas);
    }
  }
}

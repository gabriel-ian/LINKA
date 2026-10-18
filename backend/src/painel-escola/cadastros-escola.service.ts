import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { DataSource, EntityManager, In, Not } from 'typeorm';
import { Usuario } from '../usuario/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { gerarSenhaProvisoria } from '../usuario/senha-provisoria';
import { EmailService } from '../email/email.service';
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
  EditarAlunoDto,
  EditarTurmaDto,
  PerfilAprendizagemDto,
  AlocacaoDto,
  EditarProfessorDto,
  ResponsavelDto,
  VincularResponsavelDto,
} from './dto/cadastros.dto';

/** Converte o DTO de perfil nas colunas do aluno (so o que veio). */
export function perfilParaColunas(dto: PerfilAprendizagemDto): Partial<Aluno> {
  const colunas: Partial<Aluno> = {};
  if (dto.dificuldades !== undefined)
    colunas.dificuldades = dto.dificuldades?.trim() || null;
  if (dto.pontosFortes !== undefined)
    colunas.pontosFortes = dto.pontosFortes?.trim() || null;
  if (dto.interesses !== undefined) {
    const lista = [
      ...new Set(
        dto.interesses.map((i) => i.replace(/,/g, ' ').trim()).filter(Boolean),
      ),
    ];
    colunas.interesses = lista.length ? lista.join(', ') : null;
  }
  return colunas;
}

export const PASTA_LAUDOS = join(process.cwd(), 'uploads', 'laudos');
export const LAUDO_TAMANHO_MAXIMO = 10 * 1024 * 1024;

/** Tipos aceitos para laudo, conferidos pelos primeiros bytes do arquivo. */
const TIPOS_LAUDO = [
  {
    ext: '.pdf',
    mime: 'application/pdf',
    assinatura: [0x25, 0x50, 0x44, 0x46],
  },
  { ext: '.png', mime: 'image/png', assinatura: [0x89, 0x50, 0x4e, 0x47] },
  { ext: '.jpg', mime: 'image/jpeg', assinatura: [0xff, 0xd8, 0xff] },
];

/** Escritas do painel da escola. Sempre dentro do escolaId do token. */
@Injectable()
export class CadastrosEscolaService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tarefaStatusService: TarefaStatusService,
    private readonly email: EmailService,
  ) {}

  // ---------------------------------------------------------------- turma

  async criarTurma(dto: CriarTurmaDto, escolaId: number) {
    const letra = dto.letra.toUpperCase();
    const nome = `${dto.serie.trim()} ${letra}`;

    return this.dataSource.transaction(async (manager) => {
      const turmaRepo = manager.getRepository(Turma);

      if (
        await turmaRepo.findOne({
          where: { escolaId, nome, anoLetivo: dto.anoLetivo },
        })
      ) {
        throw new BadRequestException(
          `Ja existe a turma ${nome} em ${dto.anoLetivo}`,
        );
      }

      const professores = await this.professoresDaEscola(
        manager,
        dto.professorIds ?? [],
        escolaId,
      );

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
        const disciplinaIds = await this.disciplinasDoProfessor(
          manager,
          professor.id,
        );
        await this.alocar(manager, [turma.id], professor.id, disciplinaIds);
      }

      return { data: { id: turma.id, nome: turma.nome } };
    });
  }

  /** Altera dados da turma; com professorIds, troca o time de professores. */
  async editarTurma(turmaId: number, dto: EditarTurmaDto, escolaId: number) {
    return this.dataSource.transaction(async (manager) => {
      const turmaRepo = manager.getRepository(Turma);
      const turma = await turmaRepo.findOne({
        where: { id: turmaId, escolaId },
      });
      if (!turma) throw new NotFoundException('Turma nao encontrada');

      const serie = dto.serie?.trim() ?? turma.serie ?? '';
      const letra = dto.letra?.toUpperCase() ?? turma.letra ?? '';
      const anoLetivo = dto.anoLetivo ?? turma.anoLetivo;
      const nome = serie && letra ? `${serie} ${letra}` : turma.nome;

      if (nome !== turma.nome || anoLetivo !== turma.anoLetivo) {
        const repetida = await turmaRepo.findOne({
          where: {
            escolaId,
            nome: nome ?? undefined,
            anoLetivo: anoLetivo ?? undefined,
          },
        });
        if (repetida && repetida.id !== turma.id) {
          throw new BadRequestException(
            `Ja existe a turma ${nome} em ${anoLetivo}`,
          );
        }
      }

      if (dto.limiteAlunos) {
        const ocupadas = await manager
          .getRepository(Matricula)
          .count({ where: { turmaId: turma.id } });
        if (dto.limiteAlunos < ocupadas)
          throw new BadRequestException(
            `A turma ja tem ${ocupadas} alunos; o limite nao pode ser menor`,
          );
      }

      await turmaRepo.update(turma.id, {
        nome,
        serie: serie || null,
        letra: letra || null,
        anoLetivo,
        ...(dto.turno !== undefined && { turno: dto.turno }),
        ...(dto.sala !== undefined && { sala: dto.sala?.trim() || null }),
        ...(dto.limiteAlunos !== undefined && {
          limiteAlunos: dto.limiteAlunos ?? null,
        }),
      });

      if (dto.professorIds) {
        const professores = await this.professoresDaEscola(
          manager,
          dto.professorIds,
          escolaId,
        );
        await manager
          .getRepository(TurmaProfessorDisciplina)
          .delete({ turmaId: turma.id });
        for (const professor of professores) {
          const disciplinaIds = await this.disciplinasDoProfessor(
            manager,
            professor.id,
          );
          await this.alocar(manager, [turma.id], professor.id, disciplinaIds);
        }
      }

      return { data: { id: turma.id, nome } };
    });
  }

  // ------------------------------------------------------------ professor

  async criarProfessor(dto: CriarProfessorDto, escolaId: number) {
    const criado = await this.dataSource.transaction(async (manager) => {
      await this.garantirEmailLivre(manager, dto.email);
      const turmas = await this.turmasDaEscola(
        manager,
        dto.turmaIds ?? [],
        escolaId,
      );

      const usuarioRepo = manager.getRepository(Usuario);
      const usuario = await usuarioRepo.save(
        usuarioRepo.create({
          email: dto.email,
          senha: await UsuarioService.hashSenha(dto.senha),
          senhaProvisoria: true,
          perfil: 'professor',
          escolaId,
        }),
      );

      const professorRepo = manager.getRepository(Professor);
      const professor = await professorRepo.save(
        professorRepo.create({
          nomeCompleto: dto.nomeCompleto.trim(),
          usuarioId: usuario.id,
          escolaId,
        }),
      );

      const disciplinaIds = await this.disciplinasPorNome(
        manager,
        dto.disciplinas ?? [],
      );
      if (disciplinaIds.length) {
        await manager.getRepository(ProfessorDisciplina).save(
          disciplinaIds.map((disciplinaId) => ({
            professorId: professor.id,
            disciplinaId,
          })),
        );
      }

      if (dto.alocacoes) {
        await this.aplicarAlocacoes(
          manager,
          professor.id,
          disciplinaIds,
          dto.alocacoes,
          escolaId,
        );
      } else {
        await this.alocar(
          manager,
          turmas.map((t) => t.id),
          professor.id,
          disciplinaIds,
        );
      }

      return {
        data: {
          id: professor.id,
          nome: professor.nomeCompleto,
          email: usuario.email,
        },
      };
    });
    this.email.enviarAcesso({
      ...criado.data,
      senha: dto.senha,
      perfil: 'professor',
    });
    return criado;
  }

  async atualizarProfessor(
    professorId: number,
    dto: AtualizarProfessorDto,
    escolaId: number,
  ) {
    const professor = await this.dataSource
      .getRepository(Professor)
      .findOne({ where: { id: professorId, escolaId } });

    if (!professor) throw new NotFoundException('Professor nao encontrado');
    if (!professor.usuarioId)
      throw new BadRequestException('Professor sem login cadastrado');

    await this.dataSource
      .getRepository(Usuario)
      .update(professor.usuarioId, { ativo: dto.ativo });

    return { data: { id: professor.id, ativo: dto.ativo } };
  }

  /** Dados para a tela "Editar professor". */
  async professorParaEdicao(professorId: number, escolaId: number) {
    const professor = await this.dataSource
      .getRepository(Professor)
      .findOne({ where: { id: professorId, escolaId } });
    if (!professor) throw new NotFoundException('Professor nao encontrado');

    const usuario = professor.usuarioId
      ? await this.dataSource
          .getRepository(Usuario)
          .findOne({ where: { id: professor.usuarioId } })
      : null;
    const disciplinas: { nome: string }[] = await this.dataSource.query(
      `SELECT d.nome FROM professor_disciplina pd
         JOIN disciplina d ON d.id = pd.disciplina_id
        WHERE pd.professor_id = ? ORDER BY d.nome`,
      [professorId],
    );
    const linhas: {
      turmaId: number;
      turma: string;
      disciplina: string | null;
    }[] = await this.dataSource.query(
      `SELECT t.id turmaId, t.nome turma, d.nome disciplina
         FROM turma_professor_disciplina tpd
         JOIN turma t ON t.id = tpd.turma_id
         LEFT JOIN disciplina d ON d.id = tpd.disciplina_id
        WHERE tpd.professor_id = ? ORDER BY t.nome, d.nome`,
      [professorId],
    );

    const porTurma = new Map<
      number,
      { turmaId: number; turma: string; disciplinas: string[] }
    >();
    for (const l of linhas) {
      const id = Number(l.turmaId);
      const atual = porTurma.get(id) ?? {
        turmaId: id,
        turma: l.turma,
        disciplinas: [],
      };
      if (l.disciplina) atual.disciplinas.push(l.disciplina);
      porTurma.set(id, atual);
    }

    return {
      data: {
        id: Number(professor.id),
        nome: professor.nomeCompleto,
        email: usuario?.email ?? null,
        disciplinas: disciplinas.map((d) => d.nome),
        alocacoes: [...porTurma.values()],
      },
    };
  }

  /** Troca nome, disciplinas e turmas do professor de uma vez. */
  async editarProfessor(
    professorId: number,
    dto: EditarProfessorDto,
    escolaId: number,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Professor);
      const professor = await repo.findOne({
        where: { id: professorId, escolaId },
      });
      if (!professor) throw new NotFoundException('Professor nao encontrado');

      if (dto.nomeCompleto !== undefined)
        await repo.update(professor.id, {
          nomeCompleto: dto.nomeCompleto.trim(),
        });

      const disciplinaIds = await this.disciplinasPorNome(
        manager,
        dto.disciplinas,
      );
      const habilitacoes = manager.getRepository(ProfessorDisciplina);
      await habilitacoes.delete({ professorId: professor.id });
      if (disciplinaIds.length)
        await habilitacoes.save(
          disciplinaIds.map((disciplinaId) => ({
            professorId: professor.id,
            disciplinaId,
          })),
        );

      await manager
        .getRepository(TurmaProfessorDisciplina)
        .delete({ professorId: professor.id });
      await this.aplicarAlocacoes(
        manager,
        professor.id,
        disciplinaIds,
        dto.alocacoes,
        escolaId,
      );
    });
    return this.professorParaEdicao(professorId, escolaId);
  }

  /**
   * Grava turma x disciplina. As disciplinas de cada turma precisam estar
   * entre as do professor; turma sem disciplina vira uma linha sem disciplina.
   */
  private async aplicarAlocacoes(
    manager: EntityManager,
    professorId: number,
    disciplinaIds: number[],
    alocacoes: AlocacaoDto[],
    escolaId: number,
  ) {
    const turmaIds = [...new Set(alocacoes.map((a) => a.turmaId))];
    if (turmaIds.length !== alocacoes.length)
      throw new BadRequestException('Turma repetida nas alocacoes');
    await this.turmasDaEscola(manager, turmaIds, escolaId);

    const disciplinas = disciplinaIds.length
      ? await manager
          .getRepository(Disciplina)
          .find({ where: { id: In(disciplinaIds) } })
      : [];
    const idPorNome = new Map(
      disciplinas.map((d) => [d.nome.toLocaleLowerCase('pt-BR'), Number(d.id)]),
    );
    const linhas = alocacoes.flatMap((a) => {
      const ids = a.disciplinas.map((n) => {
        const id = idPorNome.get(n.trim().toLocaleLowerCase('pt-BR'));
        if (id === undefined)
          throw new BadRequestException(
            `A disciplina ${n} nao esta entre as do professor`,
          );
        return id;
      });
      return (ids.length ? ids : [null]).map((disciplinaId) => ({
        turmaId: a.turmaId,
        professorId,
        disciplinaId,
      }));
    });
    if (linhas.length)
      await manager.getRepository(TurmaProfessorDisciplina).save(linhas);
  }

  // ---------------------------------------------------------------- aluno

  async criarAluno(dto: CriarAlunoDto, escolaId: number) {
    const criado = await this.dataSource.transaction(async (manager) => {
      const [turma] = dto.turmaId
        ? await this.turmasDaEscola(manager, [dto.turmaId], escolaId)
        : [];
      await this.garantirCgmLivre(manager, dto.cgm, escolaId);
      if (turma) await this.garantirVagas(manager, turma, 1);

      const diagnosticoIds = dto.diagnosticoIds ?? [];
      if (diagnosticoIds.length) {
        const existentes = await manager
          .getRepository(Neurodivergencia)
          .count({ where: { id: In(diagnosticoIds) } });
        if (existentes !== diagnosticoIds.length)
          throw new BadRequestException('Diagnostico invalido');
      }

      const usuarioRepo = manager.getRepository(Usuario);
      let usuarioAlunoId: number | null = null;

      if (dto.email) {
        await this.garantirEmailLivre(manager, dto.email);
        const usuario = await usuarioRepo.save(
          usuarioRepo.create({
            email: dto.email,
            senha: await UsuarioService.hashSenha(dto.senha!),
            senhaProvisoria: true,
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
          neurodivergente:
            diagnosticoIds.length > 0 || !!dto.prefiroNaoInformar,
        }),
      );

      if (diagnosticoIds.length) {
        await manager.getRepository(AlunoNeurodivergencia).save(
          diagnosticoIds.map((id) => ({
            alunoId: aluno.id,
            neurodivergenciaId: id,
          })),
        );
      }

      if (turma) await this.matricular(manager, aluno.id, turma);

      const responsavel =
        dto.responsavelId !== undefined
          ? await this.vincularExistente(
              manager,
              aluno.id,
              dto.responsavelId,
              escolaId,
            )
          : dto.responsavel
            ? await this.vincularResponsavel(
                manager,
                aluno.id,
                dto.responsavel,
                escolaId,
              )
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
    if (dto.email && dto.senha) {
      this.email.enviarAcesso({
        nome: criado.data.nome,
        email: dto.email,
        senha: dto.senha,
        perfil: 'aluno',
      });
    }
    if (criado.data.responsavel) this.avisarFamilia(criado.data.responsavel);
    return criado;
  }

  /** Familia nova (com senha provisoria) recebe o acesso por e-mail. */
  private avisarFamilia(r: {
    nome: string | null;
    email: string | null;
    senhaProvisoria?: string | null;
  }): void {
    if (r.email && r.senhaProvisoria) {
      this.email.enviarAcesso({
        nome: r.nome,
        email: r.email,
        senha: r.senhaProvisoria,
        perfil: 'responsavel',
      });
    }
  }

  /** O CGM identifica o aluno na rede: nao pode repetir dentro da escola. */
  private async garantirCgmLivre(
    manager: EntityManager,
    cgm: string | null | undefined,
    escolaId: number,
    alunoId?: number,
  ) {
    const valor = cgm?.trim();
    if (!valor) return;
    const repetido = await manager.getRepository(Aluno).count({
      where: {
        escolaId,
        cgm: valor,
        ...(alunoId ? { id: Not(alunoId) } : {}),
      },
    });
    if (repetido)
      throw new BadRequestException('Ja existe um aluno com este CGM');
  }

  /**
   * Edita o aluno: dados, diagnosticos, perfil de aprendizagem e turma.
   * Trocar de turma refaz a matricula e cria os status das tarefas da turma nova.
   */
  async editarAluno(alunoId: number, dto: EditarAlunoDto, escolaId: number) {
    return this.dataSource.transaction(async (manager) => {
      const alunoRepo = manager.getRepository(Aluno);
      const aluno = await alunoRepo.findOne({
        where: { id: alunoId, escolaId },
      });
      if (!aluno) throw new NotFoundException('Aluno nao encontrado');

      const mudancas: Partial<Aluno> = { ...perfilParaColunas(dto) };
      if (dto.nomeCompleto !== undefined)
        mudancas.nomeCompleto = dto.nomeCompleto.trim();
      if (dto.dataNascimento !== undefined)
        mudancas.data_nascimento = dto.dataNascimento?.slice(0, 10) ?? null;
      if (dto.cgm !== undefined) {
        mudancas.cgm = dto.cgm?.trim() || null;
        await this.garantirCgmLivre(manager, mudancas.cgm, escolaId, alunoId);
      }

      if (
        dto.diagnosticoIds !== undefined ||
        dto.prefiroNaoInformar !== undefined
      ) {
        const ids = dto.diagnosticoIds ?? [];
        if (ids.length) {
          const existentes = await manager
            .getRepository(Neurodivergencia)
            .count({ where: { id: In(ids) } });
          if (existentes !== ids.length)
            throw new BadRequestException('Diagnostico invalido');
        }
        const vinculos = manager.getRepository(AlunoNeurodivergencia);
        await vinculos.delete({ alunoId: aluno.id });
        if (ids.length)
          await vinculos.save(
            ids.map((id) => ({ alunoId: aluno.id, neurodivergenciaId: id })),
          );
        mudancas.neurodivergente = ids.length > 0 || !!dto.prefiroNaoInformar;
      }

      if (Object.keys(mudancas).length)
        await alunoRepo.update(aluno.id, mudancas);

      if (dto.turmaId !== undefined) {
        const matriculas = manager.getRepository(Matricula);
        const atual = await matriculas.findOne({
          where: { alunoId: aluno.id },
        });
        // mysql2 devolve BIGINT como texto: compara como numero.
        const turmaAtual = atual ? Number(atual.turmaId) : null;
        if (turmaAtual !== dto.turmaId) {
          const [turma] = dto.turmaId
            ? await this.turmasDaEscola(manager, [dto.turmaId], escolaId)
            : [];
          if (turma) await this.garantirVagas(manager, turma, 1);
          await this.matricular(manager, aluno.id, turma ?? null);
        }
      }

      return { data: { id: aluno.id } };
    });
  }

  // ----------------------------------------------------- alunos na turma

  /**
   * Coloca varios alunos na turma de uma vez (alunos sem turma, ou vindos de
   * outra turma na virada do ano). Respeita o limite de alunos da turma.
   */
  async matricularAlunos(
    turmaId: number,
    alunoIds: number[],
    escolaId: number,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const [turma] = await this.turmasDaEscola(manager, [turmaId], escolaId);
      const alunos = await manager
        .getRepository(Aluno)
        .find({ where: { id: In(alunoIds), escolaId, ativo: true } });
      if (alunos.length !== alunoIds.length)
        throw new BadRequestException('Aluno nao encontrado nesta escola');

      const jaNaTurma = new Set(
        (
          await manager
            .getRepository(Matricula)
            .find({ where: { alunoId: In(alunoIds), turmaId: turma.id } })
        ).map((m) => Number(m.alunoId)),
      );
      const novos = alunoIds.filter((id) => !jaNaTurma.has(id));
      await this.garantirVagas(manager, turma, novos.length);

      for (const alunoId of novos)
        await this.matricular(manager, alunoId, turma);
      return { data: { adicionados: novos.length } };
    });
  }

  /** Tira o aluno da turma (ele fica "sem turma"). */
  async removerDaTurma(turmaId: number, alunoId: number, escolaId: number) {
    return this.dataSource.transaction(async (manager) => {
      await this.turmasDaEscola(manager, [turmaId], escolaId);
      const r = await manager
        .getRepository(Matricula)
        .delete({ alunoId, turmaId });
      if (!r.affected)
        throw new NotFoundException('Aluno nao esta nesta turma');
      return { data: true };
    });
  }

  /** Troca a matricula do aluno; turma null deixa o aluno sem turma. */
  private async matricular(
    manager: EntityManager,
    alunoId: number,
    turma: Turma | null,
  ) {
    const matriculas = manager.getRepository(Matricula);
    await matriculas.delete({ alunoId });
    if (!turma) return;
    await matriculas.save({ alunoId, turmaId: turma.id });
    await this.tarefaStatusService.seedParaAluno(alunoId, turma.id, manager);
  }

  /** 400 se a turma nao comporta mais `novos` alunos. Sem limite, sempre cabe. */
  private async garantirVagas(
    manager: EntityManager,
    turma: Turma,
    novos: number,
  ) {
    if (!turma.limiteAlunos || novos <= 0) return;
    const ocupadas = await manager
      .getRepository(Matricula)
      .count({ where: { turmaId: turma.id } });
    const livres = Math.max(0, turma.limiteAlunos - ocupadas);
    if (novos > livres)
      throw new BadRequestException(
        livres
          ? `A turma ${turma.nome} so tem ${livres} vaga(s) (limite de ${turma.limiteAlunos} alunos)`
          : `A turma ${turma.nome} esta cheia (limite de ${turma.limiteAlunos} alunos)`,
      );
  }

  // --------------------------------------------------------------- senhas

  /**
   * Gera uma senha provisoria para um login da escola (aluno, professor ou
   * responsavel de aluno da escola). Devolvida UMA vez para ser repassada.
   */
  async redefinirSenha(
    tipo: 'aluno' | 'professor' | 'responsavel',
    id: number,
    escolaId: number,
  ) {
    let usuarioId: number | null | undefined;
    let nome = '';

    if (tipo === 'aluno') {
      const a = await this.dataSource
        .getRepository(Aluno)
        .findOne({ where: { id, escolaId } });
      usuarioId = a?.usuarioId;
      nome = a?.nomeCompleto ?? '';
    } else if (tipo === 'professor') {
      const p = await this.dataSource
        .getRepository(Professor)
        .findOne({ where: { id, escolaId } });
      usuarioId = p?.usuarioId;
      nome = p?.nomeCompleto ?? '';
    } else {
      // Familia da escola: cadastrada por ela ou com filho nela.
      const [r] = await this.dataSource.query(
        `SELECT r.usuario_id usuarioId, r.nome_completo nome FROM responsavel r
          WHERE r.id = ? AND (r.escola_id = ? OR EXISTS (
            SELECT 1 FROM aluno_responsavel ar JOIN aluno a ON a.id = ar.aluno_id
             WHERE ar.responsavel_id = r.id AND a.escola_id = ?))
          LIMIT 1`,
        [id, escolaId, escolaId],
      );
      usuarioId = r?.usuarioId ?? undefined;
      nome = r?.nome ?? '';
    }

    if (usuarioId === undefined)
      throw new NotFoundException('Cadastro nao encontrado nesta escola');
    if (!usuarioId)
      throw new BadRequestException('Este cadastro nao tem login na Linka');

    const usuario = await this.dataSource
      .getRepository(Usuario)
      .findOne({ where: { id: Number(usuarioId) } });
    if (!usuario)
      throw new BadRequestException('Este cadastro nao tem login na Linka');

    const senhaProvisoria = gerarSenhaProvisoria();
    await this.dataSource.getRepository(Usuario).update(usuario.id, {
      senha: await UsuarioService.hashSenha(senhaProvisoria),
      senhaProvisoria: true,
    });

    this.email.enviarAcesso({
      nome,
      email: usuario.email,
      senha: senhaProvisoria,
      perfil: tipo,
    });
    return { data: { email: usuario.email, senhaProvisoria } };
  }

  /**
   * Responsavel ja existente (mesmo e-mail, ex.: irmaos) e so vinculado; novo
   * ganha login com senha provisoria, devolvida UMA vez para a escola repassar.
   */
  private async vincularResponsavel(
    manager: EntityManager,
    alunoId: number,
    dados: ResponsavelDto,
    escolaId: number,
  ) {
    const { responsavel, senhaProvisoria } = await this.obterOuCriarResponsavel(
      manager,
      dados,
      escolaId,
    );
    await manager
      .getRepository(AlunoResponsavel)
      .save({ alunoId, responsavelId: responsavel.id });

    return {
      id: Number(responsavel.id),
      nome: responsavel.nomeCompleto,
      email: dados.email,
      senhaProvisoria,
    };
  }

  /** Vincula ao aluno uma familia que a escola ja cadastrou. */
  private async vincularExistente(
    manager: EntityManager,
    alunoId: number,
    responsavelId: number,
    escolaId: number,
  ) {
    const responsavel = await this.responsavelDaEscola(
      manager,
      responsavelId,
      escolaId,
    );
    await manager
      .getRepository(AlunoResponsavel)
      .save({ alunoId, responsavelId: responsavel.id });
    const usuario = responsavel.usuarioId
      ? await manager
          .getRepository(Usuario)
          .findOne({ where: { id: responsavel.usuarioId } })
      : null;
    return {
      id: Number(responsavel.id),
      nome: responsavel.nomeCompleto,
      email: usuario?.email ?? null,
      senhaProvisoria: null,
    };
  }

  private async obterOuCriarResponsavel(
    manager: EntityManager,
    dados: ResponsavelDto,
    escolaId: number,
  ) {
    const usuarioRepo = manager.getRepository(Usuario);
    const responsavelRepo = manager.getRepository(Responsavel);
    let usuario = await usuarioRepo.findOne({ where: { email: dados.email } });
    let senhaProvisoria: string | null = null;

    if (usuario && usuario.perfil !== 'responsavel') {
      throw new BadRequestException(
        'O e-mail do responsavel ja e usado por outro tipo de conta',
      );
    }

    if (!usuario) {
      senhaProvisoria = gerarSenhaProvisoria();
      usuario = await usuarioRepo.save(
        usuarioRepo.create({
          email: dados.email,
          senha: await UsuarioService.hashSenha(senhaProvisoria),
          senhaProvisoria: true,
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
          escolaId,
        }),
      ));

    return { responsavel, senhaProvisoria, criado: !!senhaProvisoria };
  }

  /**
   * Familia que a escola pode usar: cadastrada por ela ou ja ligada a um
   * aluno dela. 404 para familia de outra escola.
   */
  private async responsavelDaEscola(
    manager: EntityManager,
    responsavelId: number,
    escolaId: number,
  ) {
    const [linha]: { id: number }[] = await manager.query(
      `SELECT r.id FROM responsavel r
        WHERE r.id = ? AND (r.escola_id = ? OR EXISTS (
          SELECT 1 FROM aluno_responsavel ar JOIN aluno a ON a.id = ar.aluno_id
           WHERE ar.responsavel_id = r.id AND a.escola_id = ?))`,
      [responsavelId, escolaId, escolaId],
    );
    if (!linha) throw new NotFoundException('Responsavel nao encontrado');
    return (await manager
      .getRepository(Responsavel)
      .findOne({ where: { id: Number(linha.id) } }))!;
  }

  // -------------------------------------------------------------- familias

  /** Familias da escola com os filhos (busca por nome, e-mail ou telefone). */
  async listarFamilias(escolaId: number, busca?: string) {
    const termo = busca?.trim() ? `%${busca.trim()}%` : null;
    const familias: {
      id: number;
      nome: string;
      telefone: string | null;
      parentesco: string | null;
      email: string | null;
      acessou: number;
    }[] = await this.dataSource.query(
      `SELECT r.id, r.nome_completo nome, r.telefone, r.parentesco, u.email,
              u.ultimo_login IS NOT NULL acessou
         FROM responsavel r
         LEFT JOIN usuario u ON u.id = r.usuario_id
        WHERE (r.escola_id = ? OR EXISTS (
                SELECT 1 FROM aluno_responsavel ar JOIN aluno a ON a.id = ar.aluno_id
                 WHERE ar.responsavel_id = r.id AND a.escola_id = ?))
          AND (? IS NULL OR r.nome_completo LIKE ? OR u.email LIKE ? OR r.telefone LIKE ?)
        ORDER BY r.nome_completo
        LIMIT 200`,
      [escolaId, escolaId, termo, termo, termo, termo],
    );
    if (!familias.length) return { data: [] };

    const filhos: {
      responsavelId: number;
      id: number;
      nome: string;
      turma: string | null;
    }[] = await this.dataSource.query(
      `SELECT ar.responsavel_id responsavelId, a.id, a.nome_completo nome, t.nome turma
         FROM aluno_responsavel ar
         JOIN aluno a ON a.id = ar.aluno_id AND a.escola_id = ?
         LEFT JOIN matricula m ON m.aluno_id = a.id
         LEFT JOIN turma t ON t.id = m.turma_id
        WHERE ar.responsavel_id IN (?)
        ORDER BY a.nome_completo`,
      [escolaId, familias.map((f) => f.id)],
    );

    return {
      data: familias.map((f) => ({
        id: Number(f.id),
        nome: f.nome,
        email: f.email,
        telefone: f.telefone,
        parentesco: f.parentesco,
        acessou: Boolean(Number(f.acessou)),
        filhos: filhos
          .filter((x) => Number(x.responsavelId) === Number(f.id))
          .map((x) => ({ id: Number(x.id), nome: x.nome, turma: x.turma })),
      })),
    };
  }

  /** Cadastra a familia sozinha (os filhos vem depois). */
  async criarFamilia(dto: ResponsavelDto, escolaId: number) {
    const criada = await this.dataSource.transaction(async (manager) => {
      const existe = await manager
        .getRepository(Usuario)
        .findOne({ where: { email: dto.email } });
      if (existe)
        throw new BadRequestException(
          existe.perfil === 'responsavel'
            ? 'Ja existe uma familia com este e-mail'
            : 'O e-mail do responsavel ja e usado por outro tipo de conta',
        );
      const { responsavel, senhaProvisoria } =
        await this.obterOuCriarResponsavel(manager, dto, escolaId);
      return {
        data: {
          id: Number(responsavel.id),
          nome: responsavel.nomeCompleto,
          email: dto.email,
          senhaProvisoria,
        },
      };
    });
    this.avisarFamilia(criada.data);
    return criada;
  }

  /** Liga ao aluno uma familia ja cadastrada ou uma nova. */
  async vincularAoAluno(
    alunoId: number,
    dto: VincularResponsavelDto,
    escolaId: number,
  ) {
    const vinculo = await this.dataSource.transaction(async (manager) => {
      const aluno = await manager
        .getRepository(Aluno)
        .findOne({ where: { id: alunoId, escolaId } });
      if (!aluno) throw new NotFoundException('Aluno nao encontrado');

      const resultado =
        dto.responsavelId !== undefined
          ? await this.vincularExistente(
              manager,
              alunoId,
              dto.responsavelId,
              escolaId,
            )
          : await this.vincularResponsavel(
              manager,
              alunoId,
              dto.responsavel!,
              escolaId,
            );
      return { data: resultado };
    });
    this.avisarFamilia(vinculo.data);
    return vinculo;
  }

  /** Desfaz o vinculo (a familia continua cadastrada). */
  async desvincularDoAluno(
    alunoId: number,
    responsavelId: number,
    escolaId: number,
  ) {
    const aluno = await this.dataSource
      .getRepository(Aluno)
      .findOne({ where: { id: alunoId, escolaId } });
    if (!aluno) throw new NotFoundException('Aluno nao encontrado');
    const r = await this.dataSource
      .getRepository(AlunoResponsavel)
      .delete({ alunoId, responsavelId });
    if (!r.affected)
      throw new NotFoundException('Responsavel nao vinculado a este aluno');
    return { data: true };
  }

  // ---------------------------------------------------------------- laudo

  async salvarLaudo(
    alunoId: number,
    escolaId: number,
    arquivo: Express.Multer.File | undefined,
  ) {
    if (!arquivo) throw new BadRequestException('Envie o arquivo do laudo');
    if (arquivo.size > LAUDO_TAMANHO_MAXIMO)
      throw new BadRequestException('O laudo pode ter ate 10 MB');

    const tipo = TIPOS_LAUDO.find((t) =>
      t.assinatura.every((byte, i) => arquivo.buffer[i] === byte),
    );
    if (!tipo)
      throw new BadRequestException('O laudo deve ser PDF, PNG ou JPG');

    const alunoRepo = this.dataSource.getRepository(Aluno);
    const aluno = await alunoRepo.findOne({ where: { id: alunoId, escolaId } });
    if (!aluno) throw new NotFoundException('Aluno nao encontrado');

    await fs.mkdir(PASTA_LAUDOS, { recursive: true });
    const nomeArquivo = `${aluno.id}-${Date.now()}${tipo.ext}`;
    await fs.writeFile(join(PASTA_LAUDOS, nomeArquivo), arquivo.buffer);

    if (aluno.laudo) {
      await fs.rm(join(PASTA_LAUDOS, aluno.laudo), { force: true });
    }

    await alunoRepo.update(aluno.id, {
      laudo: nomeArquivo,
      laudoEnviadoEm: new Date(),
    });

    return { data: { enviadoEm: new Date() } };
  }

  /** Caminho do laudo para download; so a escola do aluno chega aqui. */
  async caminhoLaudo(alunoId: number, escolaId: number) {
    const aluno = await this.dataSource
      .getRepository(Aluno)
      .findOne({ where: { id: alunoId, escolaId } });
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

  private async turmasDaEscola(
    manager: EntityManager,
    ids: number[],
    escolaId: number,
  ) {
    if (!ids.length) return [];
    const turmas = await manager
      .getRepository(Turma)
      .find({ where: { id: In(ids), escolaId } });
    if (turmas.length !== ids.length)
      throw new BadRequestException('Turma invalida');
    return turmas;
  }

  private async professoresDaEscola(
    manager: EntityManager,
    ids: number[],
    escolaId: number,
  ) {
    if (!ids.length) return [];
    const professores = await manager
      .getRepository(Professor)
      .find({ where: { id: In(ids), escolaId } });
    if (professores.length !== ids.length)
      throw new BadRequestException('Professor invalido');
    return professores;
  }

  private async disciplinasDoProfessor(
    manager: EntityManager,
    professorId: number,
  ): Promise<number[]> {
    const linhas: { disciplinaId: number }[] = await manager.query(
      'SELECT disciplina_id disciplinaId FROM professor_disciplina WHERE professor_id = ?',
      [professorId],
    );
    return linhas.map((l) => Number(l.disciplinaId));
  }

  /** Acha pelo nome (sem diferenciar maiusculas) ou cria a disciplina. */
  private async disciplinasPorNome(
    manager: EntityManager,
    nomes: string[],
  ): Promise<number[]> {
    const repo = manager.getRepository(Disciplina);
    const todas = await repo.find();
    const ids: number[] = [];

    for (const bruto of nomes) {
      const nome = bruto.trim();
      if (!nome) continue;
      let disciplina = todas.find(
        (d) =>
          d.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'),
      );
      if (!disciplina) {
        disciplina = await repo.save(repo.create({ nome }));
        todas.push(disciplina);
      }
      if (!ids.includes(disciplina.id)) ids.push(disciplina.id);
    }

    return ids;
  }

  /** Uma linha turma x professor x disciplina (ou sem disciplina). */
  private async alocar(
    manager: EntityManager,
    turmaIds: number[],
    professorId: number,
    disciplinaIds: number[],
  ) {
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

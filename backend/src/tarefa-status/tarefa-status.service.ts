import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TarefaStatusEntity } from './tarefa-status.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Tarefa } from '../tarefa/tarefa.entity';
import { Matricula } from '../matricula/matricula.entity';
import { Responsavel } from '../responsavel/responsavel.entity';
import { UpdateTarefaStatusDto } from './dto/update-tarefa-status.dto';

@Injectable()
export class TarefaStatusService {
  constructor(
    @InjectRepository(TarefaStatusEntity)
    private readonly statusRepository: Repository<TarefaStatusEntity>,

    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,

    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,

    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,

    @InjectRepository(Responsavel)
    private readonly responsavelRepository: Repository<Responsavel>,
  ) {}

  /**
   * Chamado pelo TarefaService ao criar uma tarefa: cria uma linha
   * "pendente" para cada aluno matriculado na turma. Sem isso a tarefa
   * existiria mas nenhum aluno teria o que "concluir".
   * Recebe o `manager` da transacao de quem chama, para que tarefa e
   * status sejam gravados juntos (ou nenhum dos dois).
   */
  async seedParaTurma(
    tarefaId: number,
    turmaId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const matriculaRepository = manager
      ? manager.getRepository(Matricula)
      : this.matriculaRepository;

    const matriculas = await matriculaRepository.find({
      where: { turmaId },
    });

    await this.inserirPendentes(
      matriculas.map((m) => ({ alunoId: m.alunoId, tarefaId })),
      manager,
    );
  }

  /**
   * Chamado pelo MatriculaService ao matricular um aluno: cria uma linha
   * "pendente" para cada tarefa que a turma ja tinha. Sem isso o aluno
   * matriculado depois da tarefa nao a veria no acompanhamento.
   */
  async seedParaAluno(
    alunoId: number,
    turmaId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const tarefaRepository = manager
      ? manager.getRepository(Tarefa)
      : this.tarefaRepository;

    const tarefas = await tarefaRepository.find({ where: { turmaId } });

    await this.inserirPendentes(
      tarefas.map((t) => ({ alunoId, tarefaId: t.id })),
      manager,
    );
  }

  /** orIgnore evita erro se a linha (aluno, tarefa) ja existir. */
  private async inserirPendentes(
    linhas: { alunoId: number; tarefaId: number }[],
    manager?: EntityManager,
  ): Promise<void> {
    if (linhas.length === 0) {
      return;
    }

    const statusRepository = manager
      ? manager.getRepository(TarefaStatusEntity)
      : this.statusRepository;

    await statusRepository
      .createQueryBuilder()
      .insert()
      .into(TarefaStatusEntity)
      .values(linhas.map((l) => ({ ...l, status: 'pendente' as const })))
      .orIgnore()
      .execute();
  }

  /** Visao da escola/professor: status das tarefas de um aluno. */
  async findAllByAluno(alunoId: number, escolaId: number) {
    const aluno = await this.alunoRepository.findOne({
      where: { id: alunoId, escolaId },
    });

    if (!aluno) {
      throw new BadRequestException('Aluno nao encontrado nesta escola');
    }

    const resultado = await this.statusRepository.find({
      where: { alunoId },
      relations: { tarefa: true },
    });

    return { data: resultado };
  }

  /**
   * Marca uma tarefa como concluida/pendente para um aluno. Faz upsert:
   * a linha normalmente ja existe (criada pelo seedParaTurma), mas cria
   * na hora se por algum motivo nao existir (ex.: aluno matriculado
   * depois da tarefa ja ter sido criada).
   */
  async updateStatus(data: UpdateTarefaStatusDto, escolaId: number) {
    const aluno = await this.alunoRepository.findOne({
      where: { id: data.alunoId, escolaId },
    });

    if (!aluno) {
      throw new BadRequestException('Aluno nao encontrado nesta escola');
    }

    const tarefa = await this.tarefaRepository.findOne({
      where: { id: data.tarefaId, turma: { escolaId } },
    });

    if (!tarefa) {
      throw new BadRequestException('Tarefa nao encontrada nesta escola');
    }

    const existente = await this.statusRepository.findOne({
      where: { alunoId: data.alunoId, tarefaId: data.tarefaId },
    });

    const concluidoEm = data.status === 'concluida' ? new Date() : null;

    if (existente) {
      existente.status = data.status;
      existente.concluido_em = concluidoEm;
      const resultado = await this.statusRepository.save(existente);

      return { data: resultado };
    }

    const novo = this.statusRepository.create({
      alunoId: data.alunoId,
      tarefaId: data.tarefaId,
      status: data.status,
      concluido_em: concluidoEm,
    });

    const resultado = await this.statusRepository.save(novo);

    return { data: resultado };
  }

  /**
   * Visao da familia: status das tarefas de todos os alunos vinculados
   * ao responsavel logado (por aluno_responsavel), independente da
   * escola — responsavel nao tem escola_id proprio.
   */
  async findAllByResponsavelUsuarioId(usuarioId: number) {
    const responsavel = await this.responsavelRepository.findOne({
      where: { usuarioId },
    });

    if (!responsavel) {
      throw new BadRequestException(
        'Usuario logado nao esta vinculado a um responsavel',
      );
    }

    const resultado = await this.statusRepository
      .createQueryBuilder('status')
      .innerJoin(
        'aluno_responsavel',
        'vinculo',
        'vinculo.aluno_id = status.aluno_id',
      )
      .innerJoinAndSelect('status.tarefa', 'tarefa')
      .innerJoinAndSelect('status.aluno', 'aluno')
      .where('vinculo.responsavel_id = :responsavelId', {
        responsavelId: responsavel.id,
      })
      .getMany();

    return { data: resultado };
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarefa } from './tarefa.entity';
import { Turma } from '../turma/turma.entity';
import { Disciplina } from '../disciplina/disciplina.entity';
import { Professor } from '../professor/professor.entity';
import { CreateTarefaDto } from './dto/create-tarefa.dto';

@Injectable()
export class TarefaService {
  constructor(
    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,

    @InjectRepository(Turma)
    private readonly turmaRepository: Repository<Turma>,

    @InjectRepository(Disciplina)
    private readonly disciplinaRepository: Repository<Disciplina>,

    @InjectRepository(Professor)
    private readonly professorRepository: Repository<Professor>,
  ) {}

  /**
   * Quem cria a tarefa e sempre o professor logado — professorId nunca
   * vem do corpo da requisicao, e sim resolvido a partir do usuarioId do
   * token, mesmo espirito do login: o cliente nao escolhe a propria
   * identidade.
   */
  async create(data: CreateTarefaDto, usuarioId: number, escolaId: number) {
    const professor = await this.professorRepository.findOne({
      where: { usuarioId, escolaId },
    });

    if (!professor) {
      throw new BadRequestException(
        'Usuario logado nao esta vinculado a um professor desta escola',
      );
    }

    const turma = await this.turmaRepository.findOne({
      where: { id: data.turmaId, escolaId },
    });

    if (!turma) {
      throw new BadRequestException('Turma nao encontrada nesta escola');
    }

    const disciplina = await this.disciplinaRepository.findOne({
      where: { id: data.disciplinaId },
    });

    if (!disciplina) {
      throw new BadRequestException('Disciplina nao encontrada');
    }

    const tarefa = this.tarefaRepository.create({
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      data_entrega: data.data_entrega ?? null,
      hora_limite: data.hora_limite ?? null,
      turmaId: turma.id,
      disciplinaId: disciplina.id,
      professorId: professor.id,
    });

    const resultado = await this.tarefaRepository.save(tarefa);

    return { data: resultado };
  }

  async findAllByEscola(escolaId: number) {
    const resultado = await this.tarefaRepository.find({
      where: { turma: { escolaId } },
      relations: { turma: true, disciplina: true, professor: true },
      order: { criado_em: 'DESC' },
    });

    return { data: resultado };
  }
}

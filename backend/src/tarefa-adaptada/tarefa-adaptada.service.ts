import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarefaAdaptada } from './tarefa-adaptada.entity';
import { Tarefa } from '../tarefa/tarefa.entity';
import { Aluno } from '../aluno/aluno.entity';
import { CreateTarefaAdaptadaDto } from './dto/create-tarefa-adaptada.dto';

@Injectable()
export class TarefaAdaptadaService {
  constructor(
    @InjectRepository(TarefaAdaptada)
    private readonly tarefaAdaptadaRepository: Repository<TarefaAdaptada>,

    @InjectRepository(Tarefa)
    private readonly tarefaRepository: Repository<Tarefa>,

    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
  ) {}

  async create(data: CreateTarefaAdaptadaDto, escolaId: number) {
    // Tarefa e aluno precisam ser da escola logada, mesma regra usada
    // em matricula para nao vazar dado entre escolas.
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: data.tarefaId, turma: { escolaId } },
    });

    if (!tarefa) {
      throw new BadRequestException('Tarefa nao encontrada nesta escola');
    }

    const aluno = await this.alunoRepository.findOne({
      where: { id: data.alunoId, escolaId },
    });

    if (!aluno) {
      throw new BadRequestException('Aluno nao encontrado nesta escola');
    }

    const adaptacao = this.tarefaAdaptadaRepository.create({
      tarefaId: tarefa.id,
      alunoId: aluno.id,
      descricao_adaptada: data.descricaoAdaptada,
      gerado_por_ia: data.geradoPorIa ?? true,
    });

    const resultado = await this.tarefaAdaptadaRepository.save(adaptacao);

    return { data: resultado };
  }

  async findAllByTarefa(tarefaId: number, escolaId: number) {
    const tarefa = await this.tarefaRepository.findOne({
      where: { id: tarefaId, turma: { escolaId } },
    });

    if (!tarefa) {
      throw new BadRequestException('Tarefa nao encontrada nesta escola');
    }

    const resultado = await this.tarefaAdaptadaRepository.find({
      where: { tarefaId },
      relations: { aluno: true },
    });

    return { data: resultado };
  }
}

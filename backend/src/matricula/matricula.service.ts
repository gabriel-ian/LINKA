import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Matricula } from './matricula.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Turma } from '../turma/turma.entity';
import { CreateMatriculaDto } from './dto/create-matricula.dto';

@Injectable()
export class MatriculaService {
  constructor(
    @InjectRepository(Matricula)
    private readonly matriculaRepository: Repository<Matricula>,

    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,

    @InjectRepository(Turma)
    private readonly turmaRepository: Repository<Turma>,
  ) {}

  async create(data: CreateMatriculaDto, escolaId: number) {
    // Aluno e turma precisam ser da escola logada, senao uma escola
    // conseguiria matricular aluno de outra.
    const aluno = await this.alunoRepository.findOne({
      where: { id: data.alunoId, escolaId },
    });

    if (!aluno) {
      throw new BadRequestException('Aluno nao encontrado nesta escola');
    }

    const turma = await this.turmaRepository.findOne({
      where: { id: data.turmaId, escolaId },
    });

    if (!turma) {
      throw new BadRequestException('Turma nao encontrada nesta escola');
    }

    const existente = await this.matriculaRepository.findOne({
      where: { alunoId: aluno.id, turmaId: turma.id },
    });

    if (existente) {
      throw new BadRequestException('Aluno ja matriculado nesta turma');
    }

    const matricula = this.matriculaRepository.create({
      alunoId: aluno.id,
      turmaId: turma.id,
    });

    const resultado = await this.matriculaRepository.save(matricula);

    return { data: resultado };
  }

  async findAllByEscola(escolaId: number) {
    const resultado = await this.matriculaRepository.find({
      where: { turma: { escolaId } },
      relations: { aluno: true, turma: true },
    });

    return { data: resultado };
  }
}

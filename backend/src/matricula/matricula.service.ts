import { Injectable, BadRequestException } from '@nestjs/common';
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
    const aluno = await this.alunoRepository.findOne({
      where: {
        id: data.alunoId,
        escola: { id: escolaId },
      },
    });

    if (!aluno) {
      throw new BadRequestException('Aluno não encontrado');
    }

    const turma = await this.turmaRepository.findOne({
      where: {
        id: data.turmaId,
        escola: { id: escolaId },
      },
    });

    if (!turma) {
      throw new BadRequestException('Turma não encontrada');
    }

    const existente = await this.matriculaRepository.findOne({
      where: {
        aluno: { id: aluno.id },
        turma: { id: turma.id },
      },
    });

    if (existente) {
      throw new BadRequestException('Aluno já matriculado');
    }

    const matricula = this.matriculaRepository.create({
      aluno,
      turma,
    });

    const resultado = await this.matriculaRepository.save(matricula);

    return {
      data: resultado,
    };
  }

  async findAllByEscola(escolaId: number) {
    const resultado = await this.matriculaRepository.find({
      where: {
        turma: {
          escola: { id: escolaId },
        },
      },
      relations: {
        aluno: true,
        turma: true,
      },
    });

    return {
      data: resultado,
    };
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turma } from './turma.entity';
import { Escola } from '../escola/escola.entity';

@Injectable()
export class TurmaService {
  constructor(
    @InjectRepository(Turma)
    private readonly turmaRepository: Repository<Turma>,
  ) {}

  async findAllByEscola(escolaId: number) {
    const resultado = await this.turmaRepository.find({
      where: {
        escola: { id: escolaId },
      },
      relations: {
        escola: true,
      },
    });

    return {
      data: resultado,
    };
  }

  async create(data: Partial<Turma>, escolaId: number) {
    const turma = this.turmaRepository.create({
      ...data,
      escola: { id: escolaId } as Escola,
    });

    const resultado = await this.turmaRepository.save(turma);

    return {
      data: resultado,
    };
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turma } from './turma.entity';
import { Escola } from '../escola/escola.entity';
import { CreateTurmaDto } from './dto/create-turma.dto';

@Injectable()
export class TurmaService {
  constructor(
    @InjectRepository(Turma)
    private readonly turmaRepository: Repository<Turma>,
  ) {}

  create(data: CreateTurmaDto, escolaId: number) {
    const turma = this.turmaRepository.create({
      ...data,
      escola: { id: escolaId } as Escola,
    });

    return this.turmaRepository.save(turma);
  }

  findAllByEscola(escolaId: number) {
    return this.turmaRepository.find({
      where: {
        escola: {
          id: escolaId,
        },
      },
      relations: {
        escola: true,
      },
    });
  }
}
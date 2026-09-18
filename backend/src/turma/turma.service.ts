import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Turma } from './turma.entity';
import { CreateTurmaDto } from './dto/create-turma.dto';

@Injectable()
export class TurmaService {
  constructor(
    @InjectRepository(Turma)
    private readonly turmaRepository: Repository<Turma>,
  ) {}

  async findAllByEscola(escolaId: number) {
    const resultado = await this.turmaRepository.find({
      where: { escolaId },
      order: { nome: 'ASC' },
    });

    return { data: resultado };
  }

  async create(data: CreateTurmaDto, escolaId: number) {
    const turma = this.turmaRepository.create({
      nome: data.nome,
      escolaId,
    });

    const resultado = await this.turmaRepository.save(turma);

    return { data: resultado };
  }
}

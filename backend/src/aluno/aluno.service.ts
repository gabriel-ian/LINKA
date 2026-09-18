import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aluno } from './aluno.entity';
import { CreateAlunoDto } from './dto/create-aluno.dto';

@Injectable()
export class AlunoService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
  ) {}

  async findAllByEscola(escolaId: number) {
    const resultado = await this.alunoRepository.find({
      where: { escolaId },
      order: { nomeCompleto: 'ASC' },
    });

    return { data: resultado };
  }

  async create(data: CreateAlunoDto, escolaId: number) {
    const aluno = this.alunoRepository.create({
      nomeCompleto: data.nomeCompleto,
      // Guardado como string 'YYYY-MM-DD' para nao deslocar a data pelo fuso.
      data_nascimento: data.data_nascimento ?? null,
      cgm: data.cgm ?? null,
      neurodivergente: data.neurodivergente ?? false,
      laudo: data.laudo ?? null,
      escolaId,
    });

    const resultado = await this.alunoRepository.save(aluno);

    return { data: resultado };
  }
}

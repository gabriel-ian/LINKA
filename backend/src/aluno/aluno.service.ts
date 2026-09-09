import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aluno } from './aluno.entity';
import { Escola } from '../escola/escola.entity';
import { CreateAlunoDto } from './dto/create-aluno.dto'; // 👈 FALTAVA ISSO

@Injectable()
export class AlunoService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
  ) {}

  async findAllByEscola(escolaId: number) {
    const resultado = await this.alunoRepository.find({
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

  async create(data: CreateAlunoDto, escolaId: number) {
    const aluno = this.alunoRepository.create({
      ...data,
      escola: { id: escolaId } as Escola,
    });

    const resultado = await this.alunoRepository.save(aluno);

    return {
      data: resultado,
    };
  }
}
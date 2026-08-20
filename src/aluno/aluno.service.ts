import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aluno } from './aluno.entity';
import { Escola } from '../escola/escola.entity';
import { CreateAlunoDto } from './dto/create-aluno.dto';

@Injectable()
export class AlunoService {
  constructor(
    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,
  ) {}

  
  findAllByEscola(escolaId: number) {
    return this.alunoRepository.find({
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


  create(data: CreateAlunoDto, escolaId: number) {
    const aluno = this.alunoRepository.create({
      ...data,
      escola: { id: escolaId } as Escola,
    });

    return this.alunoRepository.save(aluno);
  }
}
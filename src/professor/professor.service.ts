import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professor } from './professor.entity';
import { Escola } from '../escola/escola.entity';
import { CreateProfessorDto } from './dto/create-professor.dto';

@Injectable()
export class ProfessorService {
  constructor(
    @InjectRepository(Professor)
    private readonly professorRepository: Repository<Professor>,
  ) {}

  
  findAllByEscola(escolaId: number) {
    return this.professorRepository.find({
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

  
  create(data: CreateProfessorDto, escolaId: number) {
    const professor = this.professorRepository.create({
      ...data,
      escola: { id: escolaId } as Escola,
    });

    return this.professorRepository.save(professor);
  }
}
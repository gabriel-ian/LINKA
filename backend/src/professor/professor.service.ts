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

  
  async findAllByEscola(escolaId: number) {
    const resultado = await this.professorRepository.find({
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

  
  async create(data: CreateProfessorDto, escolaId: number) {
    const professor = this.professorRepository.create({
      ...data,
      escola: { id: escolaId } as Escola,
    });

    const resultado = await this.professorRepository.save(professor);

    return {
      data: resultado,
    };
  }
}
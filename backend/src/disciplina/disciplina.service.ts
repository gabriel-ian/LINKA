import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Disciplina } from './disciplina.entity';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';

@Injectable()
export class DisciplinaService {
  constructor(
    @InjectRepository(Disciplina)
    private readonly disciplinaRepository: Repository<Disciplina>,
  ) {}

  async findAll() {
    // So o catalogo padrao: as criadas por uma escola ficam so com ela.
    const resultado = await this.disciplinaRepository.find({
      where: { escolaId: IsNull() },
      order: { nome: 'ASC' },
    });

    return { data: resultado };
  }

  async create(data: CreateDisciplinaDto) {
    const disciplina = this.disciplinaRepository.create({ nome: data.nome });
    const resultado = await this.disciplinaRepository.save(disciplina);

    return { data: resultado };
  }
}

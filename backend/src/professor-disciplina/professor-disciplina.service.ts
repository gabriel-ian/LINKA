import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfessorDisciplina } from './professor-disciplina.entity';
import { Professor } from '../professor/professor.entity';
import { Disciplina } from '../disciplina/disciplina.entity';
import { CreateProfessorDisciplinaDto } from './dto/create-professor-disciplina.dto';

@Injectable()
export class ProfessorDisciplinaService {
  constructor(
    @InjectRepository(ProfessorDisciplina)
    private readonly vinculoRepository: Repository<ProfessorDisciplina>,

    @InjectRepository(Professor)
    private readonly professorRepository: Repository<Professor>,

    @InjectRepository(Disciplina)
    private readonly disciplinaRepository: Repository<Disciplina>,
  ) {}

  async create(data: CreateProfessorDisciplinaDto, escolaId: number) {
    // O professor precisa ser da escola logada, senao uma escola
    // conseguiria habilitar professor de outra escola.
    const professor = await this.professorRepository.findOne({
      where: { id: data.professorId, escolaId },
    });

    if (!professor) {
      throw new BadRequestException('Professor nao encontrado nesta escola');
    }

    const disciplina = await this.disciplinaRepository.findOne({
      where: { id: data.disciplinaId },
    });

    if (!disciplina) {
      throw new BadRequestException('Disciplina nao encontrada');
    }

    const existente = await this.vinculoRepository.findOne({
      where: { professorId: professor.id, disciplinaId: disciplina.id },
    });

    if (existente) {
      throw new BadRequestException(
        'Professor ja habilitado nesta disciplina',
      );
    }

    const vinculo = this.vinculoRepository.create({
      professorId: professor.id,
      disciplinaId: disciplina.id,
    });

    const resultado = await this.vinculoRepository.save(vinculo);

    return { data: resultado };
  }

  async findAllByEscola(escolaId: number) {
    const resultado = await this.vinculoRepository.find({
      where: { professor: { escolaId } },
      relations: { professor: true, disciplina: true },
    });

    return { data: resultado };
  }

  async remove(professorId: number, disciplinaId: number, escolaId: number) {
    const professor = await this.professorRepository.findOne({
      where: { id: professorId, escolaId },
    });

    if (!professor) {
      throw new BadRequestException('Professor nao encontrado nesta escola');
    }

    await this.vinculoRepository.delete({ professorId, disciplinaId });

    return { data: true };
  }
}

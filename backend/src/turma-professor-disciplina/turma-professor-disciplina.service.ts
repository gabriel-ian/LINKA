import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurmaProfessorDisciplina } from './turma-professor-disciplina.entity';
import { Turma } from '../turma/turma.entity';
import { Professor } from '../professor/professor.entity';
import { Disciplina } from '../disciplina/disciplina.entity';
import { CreateAlocacaoDto } from './dto/create-alocacao.dto';

@Injectable()
export class TurmaProfessorDisciplinaService {
  constructor(
    @InjectRepository(TurmaProfessorDisciplina)
    private readonly alocacaoRepository: Repository<TurmaProfessorDisciplina>,

    @InjectRepository(Turma)
    private readonly turmaRepository: Repository<Turma>,

    @InjectRepository(Professor)
    private readonly professorRepository: Repository<Professor>,

    @InjectRepository(Disciplina)
    private readonly disciplinaRepository: Repository<Disciplina>,
  ) {}

  async create(data: CreateAlocacaoDto, escolaId: number) {
    // Turma e professor precisam ser da escola logada.
    const turma = await this.turmaRepository.findOne({
      where: { id: data.turmaId, escolaId },
    });

    if (!turma) {
      throw new BadRequestException('Turma nao encontrada nesta escola');
    }

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

    const existente = await this.alocacaoRepository.findOne({
      where: {
        turmaId: turma.id,
        professorId: professor.id,
        disciplinaId: disciplina.id,
      },
    });

    if (existente) {
      throw new BadRequestException('Esta alocacao ja existe');
    }

    const alocacao = this.alocacaoRepository.create({
      turmaId: turma.id,
      professorId: professor.id,
      disciplinaId: disciplina.id,
    });

    const resultado = await this.alocacaoRepository.save(alocacao);

    return { data: resultado };
  }

  async findAllByEscola(escolaId: number) {
    const resultado = await this.alocacaoRepository.find({
      where: { turma: { escolaId } },
      relations: { turma: true, professor: true, disciplina: true },
    });

    return { data: resultado };
  }

  async remove(id: number, escolaId: number) {
    const alocacao = await this.alocacaoRepository.findOne({
      where: { id, turma: { escolaId } },
    });

    if (!alocacao) {
      throw new BadRequestException('Alocacao nao encontrada nesta escola');
    }

    await this.alocacaoRepository.delete(id);

    return { data: true };
  }
}

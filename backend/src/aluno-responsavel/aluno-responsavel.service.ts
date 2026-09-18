import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlunoResponsavel } from './aluno-responsavel.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Responsavel } from '../responsavel/responsavel.entity';
import { CreateAlunoResponsavelDto } from './dto/create-aluno-responsavel.dto';

@Injectable()
export class AlunoResponsavelService {
  constructor(
    @InjectRepository(AlunoResponsavel)
    private readonly vinculoRepository: Repository<AlunoResponsavel>,

    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,

    @InjectRepository(Responsavel)
    private readonly responsavelRepository: Repository<Responsavel>,
  ) {}

  async create(data: CreateAlunoResponsavelDto, escolaId: number) {
    // O aluno precisa ser da escola logada; o responsavel nao tem
    // escola_id (pode acompanhar alunos de escolas diferentes).
    const aluno = await this.alunoRepository.findOne({
      where: { id: data.alunoId, escolaId },
    });

    if (!aluno) {
      throw new BadRequestException('Aluno nao encontrado nesta escola');
    }

    const responsavel = await this.responsavelRepository.findOne({
      where: { id: data.responsavelId },
    });

    if (!responsavel) {
      throw new BadRequestException('Responsavel nao encontrado');
    }

    const existente = await this.vinculoRepository.findOne({
      where: { alunoId: aluno.id, responsavelId: responsavel.id },
    });

    if (existente) {
      throw new BadRequestException('Vinculo ja existe');
    }

    const vinculo = this.vinculoRepository.create({
      alunoId: aluno.id,
      responsavelId: responsavel.id,
    });

    const resultado = await this.vinculoRepository.save(vinculo);

    return { data: resultado };
  }

  async findAllByAluno(alunoId: number, escolaId: number) {
    const aluno = await this.alunoRepository.findOne({
      where: { id: alunoId, escolaId },
    });

    if (!aluno) {
      throw new BadRequestException('Aluno nao encontrado nesta escola');
    }

    const resultado = await this.vinculoRepository.find({
      where: { alunoId },
      relations: { responsavel: true },
    });

    return { data: resultado };
  }
}

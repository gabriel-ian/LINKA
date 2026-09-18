import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlunoNeurodivergencia } from './aluno-neurodivergencia.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Neurodivergencia } from '../neurodivergencia/neurodivergencia.entity';
import { CreateAlunoNeurodivergenciaDto } from './dto/create-aluno-neurodivergencia.dto';

@Injectable()
export class AlunoNeurodivergenciaService {
  constructor(
    @InjectRepository(AlunoNeurodivergencia)
    private readonly vinculoRepository: Repository<AlunoNeurodivergencia>,

    @InjectRepository(Aluno)
    private readonly alunoRepository: Repository<Aluno>,

    @InjectRepository(Neurodivergencia)
    private readonly neurodivergenciaRepository: Repository<Neurodivergencia>,
  ) {}

  async create(data: CreateAlunoNeurodivergenciaDto, escolaId: number) {
    const aluno = await this.alunoRepository.findOne({
      where: { id: data.alunoId, escolaId },
    });

    if (!aluno) {
      throw new BadRequestException('Aluno nao encontrado nesta escola');
    }

    const neurodivergencia = await this.neurodivergenciaRepository.findOne({
      where: { id: data.neurodivergenciaId },
    });

    if (!neurodivergencia) {
      throw new BadRequestException('Neurodivergencia nao encontrada');
    }

    const existente = await this.vinculoRepository.findOne({
      where: {
        alunoId: aluno.id,
        neurodivergenciaId: neurodivergencia.id,
      },
    });

    if (existente) {
      throw new BadRequestException('Vinculo ja existe para este aluno');
    }

    const vinculo = this.vinculoRepository.create({
      alunoId: aluno.id,
      neurodivergenciaId: neurodivergencia.id,
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
      relations: { neurodivergencia: true },
    });

    return { data: resultado };
  }
}

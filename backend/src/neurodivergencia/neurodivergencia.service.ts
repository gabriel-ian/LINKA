import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Neurodivergencia } from './neurodivergencia.entity';
import { CreateNeurodivergenciaDto } from './dto/create-neurodivergencia.dto';

@Injectable()
export class NeurodivergenciaService {
  constructor(
    @InjectRepository(Neurodivergencia)
    private readonly neurodivergenciaRepository: Repository<Neurodivergencia>,
  ) {}

  async findAll() {
    const resultado = await this.neurodivergenciaRepository.find({
      order: { nome: 'ASC' },
    });

    return { data: resultado };
  }

  async create(data: CreateNeurodivergenciaDto) {
    const neurodivergencia = this.neurodivergenciaRepository.create({
      nome: data.nome,
    });
    const resultado =
      await this.neurodivergenciaRepository.save(neurodivergencia);

    return { data: resultado };
  }
}

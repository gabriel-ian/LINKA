import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Escola } from './escola.entity';

@Injectable()
export class EscolaService {
  constructor(
    @InjectRepository(Escola)
    private readonly escolaRepository: Repository<Escola>,
  ) {}

  async findAll() {
    const resultado = await this.escolaRepository.find();

    return {
      data: resultado,
    };
  }

  async findOne(id: number) {
    const resultado = await this.escolaRepository.findOne({
      where: { id },
    });

    return {
      data: resultado,
    };
  }

  async create(data: Partial<Escola>) {
    const escola = this.escolaRepository.create(data);
    const resultado = await this.escolaRepository.save(escola);

    return {
      data: resultado,
    };
  }

  async update(id: number, data: Partial<Escola>) {
    await this.escolaRepository.update(id, data);

    const resultado = await this.findOne(id);

    return resultado;
  }

  async remove(id: number) {
    await this.escolaRepository.update(id, { ativo: false });

    return {
      data: true,
    };
  }

  async activate(id: number) {
    await this.escolaRepository.update(id, { ativo: true });

    return {
      data: true,
    };
  }

  async findByEmail(email: string) {
    return this.escolaRepository.findOne({
      where: { email },
    });
  }
}
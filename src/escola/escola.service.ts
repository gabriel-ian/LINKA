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

  findAll() {
    return this.escolaRepository.find();
  }

  findOne(id: number) {
    return this.escolaRepository.findOne({
      where: { id },
    });
  }

  create(data: Partial<Escola>) {
    return this.escolaRepository.save(data);
  }

  update(id: number, data: Partial<Escola>) {
    return this.escolaRepository.update(id, data);
  }

  remove(id: number) {
    return this.escolaRepository.update(id, {
      ativo: false,
    });
  }

  activate(id: number) {
    return this.escolaRepository.update(id, {
      ativo: true,
    });
  }

  findByEmail(email: string) {
    return this.escolaRepository.findOne({
      where: { email },
    });
  }
}
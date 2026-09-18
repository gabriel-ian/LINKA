import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Escola } from './escola.entity';
import { CreateEscolaDto } from './dto/create-escola.dto';
import { UpdateEscolaDto } from './dto/update-escola.dto';

@Injectable()
export class EscolaService {
  constructor(
    @InjectRepository(Escola)
    private readonly escolaRepository: Repository<Escola>,
  ) {}

  async findAll() {
    const resultado = await this.escolaRepository.find({
      order: { nome: 'ASC' },
    });

    return { data: resultado };
  }

  async findOne(id: number) {
    const resultado = await this.escolaRepository.findOne({ where: { id } });

    if (!resultado) {
      throw new NotFoundException('Escola nao encontrada');
    }

    return { data: resultado };
  }

  async create(data: CreateEscolaDto) {
    const escola = this.escolaRepository.create({
      nome: data.nome,
      cnpj: data.cnpj ?? null,
    });

    const resultado = await this.escolaRepository.save(escola);

    return { data: resultado };
  }

  async update(id: number, data: UpdateEscolaDto) {
    await this.findOne(id);
    await this.escolaRepository.update(id, data);

    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.escolaRepository.update(id, { ativo: false });

    return { data: true };
  }

  async activate(id: number) {
    await this.findOne(id);
    await this.escolaRepository.update(id, { ativo: true });

    return { data: true };
  }

  // findByEmail foi removido: a tabela `escola` nao tem coluna email.
  // O login agora passa por UsuarioService.findByEmail.
}

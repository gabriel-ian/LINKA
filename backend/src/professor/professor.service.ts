import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Professor } from './professor.entity';
import { Usuario } from '../usuario/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { CreateProfessorDto } from './dto/create-professor.dto';

@Injectable()
export class ProfessorService {
  constructor(
    @InjectRepository(Professor)
    private readonly professorRepository: Repository<Professor>,
    private readonly dataSource: DataSource,
  ) {}

  async findAllByEscola(escolaId: number) {
    const resultado = await this.professorRepository.find({
      where: { escolaId },
      relations: { usuario: true },
      order: { nomeCompleto: 'ASC' },
    });

    // Nao devolver o hash da senha para o cliente.
    const data = resultado.map((professor) => ({
      id: professor.id,
      nomeCompleto: professor.nomeCompleto,
      escolaId: professor.escolaId,
      email: professor.usuario?.email ?? null,
    }));

    return { data };
  }

  /**
   * Cria usuario + professor na mesma transacao:
   * se um falhar, nenhum dos dois e gravado.
   */
  async create(data: CreateProfessorDto, escolaId: number) {
    return this.dataSource.transaction(async (manager) => {
      const usuarioRepo = manager.getRepository(Usuario);

      const jaExiste = await usuarioRepo.findOne({
        where: { email: data.email },
      });

      if (jaExiste) {
        throw new BadRequestException('Ja existe um usuario com este email');
      }

      const usuario = usuarioRepo.create({
        email: data.email,
        senha: await UsuarioService.hashSenha(data.senha),
        perfil: 'professor',
        escolaId,
      });

      const usuarioSalvo = await usuarioRepo.save(usuario);

      const professorRepo = manager.getRepository(Professor);

      const professor = professorRepo.create({
        nomeCompleto: data.nomeCompleto,
        usuarioId: usuarioSalvo.id,
        escolaId,
      });

      const professorSalvo = await professorRepo.save(professor);

      return {
        data: {
          id: professorSalvo.id,
          nomeCompleto: professorSalvo.nomeCompleto,
          escolaId: professorSalvo.escolaId,
          email: usuarioSalvo.email,
        },
      };
    });
  }
}

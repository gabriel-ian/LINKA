import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { PerfilUsuario, Usuario } from './usuario.entity';

const SALT_ROUNDS = 10;

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  /** Usado pelo login: precisa trazer a senha, entao nao seleciona campos parciais. */
  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({ where: { id } });
  }

  static async hashSenha(senha: string): Promise<string> {
    return bcrypt.hash(senha, SALT_ROUNDS);
  }

  static async conferirSenha(senha: string, hash: string): Promise<boolean> {
    return bcrypt.compare(senha, hash);
  }

  /**
   * Cria um usuario com a senha ja hasheada.
   * Recebe o manager opcional para participar de uma transacao externa
   * (ex.: criar professor e usuario juntos).
   */
  async create(
    dados: {
      email: string;
      senha: string;
      perfil: PerfilUsuario;
      escolaId: number | null;
    },
    repository: Repository<Usuario> = this.usuarioRepository,
  ): Promise<Usuario> {
    const usuario = repository.create({
      email: dados.email,
      senha: await UsuarioService.hashSenha(dados.senha),
      perfil: dados.perfil,
      escolaId: dados.escolaId,
    });

    return repository.save(usuario);
  }
}

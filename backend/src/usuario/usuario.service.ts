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

  /**
   * Usado pelo login: precisa trazer a senha, entao nao seleciona campos parciais.
   * Traz a escola junto para o login barrar escola desativada.
   */
  async findByEmail(email: string): Promise<Usuario | null> {
    return this.usuarioRepository.findOne({
      where: { email },
      relations: { escola: true },
    });
  }

  /**
   * Conta existe, esta ativa e (se tiver escola) a escola esta ativa.
   * Conferido a cada requisicao: desativar alguem corta o acesso na hora,
   * sem esperar o token expirar.
   */
  async acessoLiberado(id: number): Promise<boolean> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id },
      relations: { escola: true },
    });
    return !!usuario && usuario.ativo !== false && (!usuario.escola || usuario.escola.ativo);
  }

  async registrarLogin(id: number): Promise<void> {
    await this.usuarioRepository.update(id, { ultimoLogin: new Date() });
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

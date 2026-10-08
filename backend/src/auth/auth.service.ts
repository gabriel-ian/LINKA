import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsuarioService } from '../usuario/usuario.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usuarioService: UsuarioService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * O perfil NAO vem mais do formulario: ele e lido da tabela `usuario`.
   * Deixar o cliente escolher o proprio perfil era uma falha de autorizacao.
   */
  /** Qualquer perfil troca a propria senha (ex.: depois de uma provisoria). */
  async alterarSenha(usuarioId: number, senhaAtual: string, novaSenha: string) {
    const usuario = await this.usuarioService.findById(usuarioId);
    if (
      !usuario ||
      !(await UsuarioService.conferirSenha(senhaAtual, usuario.senha))
    ) {
      throw new BadRequestException('Senha atual incorreta');
    }
    if (senhaAtual === novaSenha) {
      throw new BadRequestException(
        'A nova senha precisa ser diferente da atual',
      );
    }

    await this.usuarioService.definirSenha(usuario.id, novaSenha);
    return { data: true };
  }

  async login(email: string, senha: string) {
    const usuario = await this.usuarioService.findByEmail(email);

    // Mesma mensagem para email inexistente e senha errada,
    // para nao revelar quais emails estao cadastrados.
    if (!usuario) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const senhaConfere = await UsuarioService.conferirSenha(
      senha,
      usuario.senha,
    );

    if (!senhaConfere) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    // Conta desativada (ex.: professor desligado pela escola).
    if (usuario.ativo === false) {
      throw new ForbiddenException('Conta desativada');
    }

    // Escola desativada: todos os logins vinculados a ela ficam suspensos.
    // So depois de conferir a senha, para nao revelar o status a terceiros.
    if (usuario.escola && !usuario.escola.ativo) {
      throw new ForbiddenException('Escola desativada');
    }

    await this.usuarioService.registrarLogin(usuario.id);

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      escolaId: usuario.escolaId ?? null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      perfil: usuario.perfil,
      escolaId: usuario.escolaId ?? null,
    };
  }
}

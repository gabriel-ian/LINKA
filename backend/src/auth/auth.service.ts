import { Injectable, UnauthorizedException } from '@nestjs/common';
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

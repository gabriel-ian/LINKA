import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsuarioService } from '../usuario/usuario.service';

export interface UsuarioAutenticado {
  userId: number;
  email: string;
  perfil: 'admin' | 'escola' | 'professor' | 'responsavel';
  escolaId: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usuarios: UsuarioService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<UsuarioAutenticado> {
    // Token valido nao basta: a conta ou a escola podem ter sido desativadas
    // depois do login.
    if (!(await this.usuarios.acessoLiberado(Number(payload.sub)))) {
      throw new UnauthorizedException('Acesso encerrado');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      perfil: payload.perfil,
      // escolaId vem separado do sub: sub e o id do usuario,
      // nao o id da escola. Confundir os dois era o bug antigo.
      escolaId: payload.escolaId ?? null,
    };
  }
}

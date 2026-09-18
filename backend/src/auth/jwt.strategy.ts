import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface UsuarioAutenticado {
  userId: number;
  email: string;
  perfil: 'admin' | 'escola' | 'professor' | 'responsavel';
  escolaId: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: any): UsuarioAutenticado {
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

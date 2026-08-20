import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EscolaService } from '../escola/escola.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly escolaService: EscolaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, senha: string) {
    const escola = await this.escolaService.findByEmail(email);

    if (!escola || escola.senha !== senha) {
      throw new UnauthorizedException('Email ou senha inválidos');
    }

    const payload = {
      sub: escola.id,
      email: escola.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
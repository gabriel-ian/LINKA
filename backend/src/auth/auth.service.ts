import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EscolaService } from '../escola/escola.service';

@Injectable()
export class AuthService {
  constructor(
    private escolaService: EscolaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, senha: string, perfil: string) {

    let user: any;

  
    if (perfil === 'escola') {
      user = await this.escolaService.findByEmail(email);
    }

    

    if (!user || user.senha !== senha) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    
    const payload = {
      sub: user.id,
      perfil: perfil,
    };

    return {
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        perfil: perfil
      })
    };
  }
}
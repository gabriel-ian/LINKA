import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsuarioService } from '../usuario/usuario.service';

describe('JwtStrategy', () => {
  const config = { getOrThrow: () => 'segredo' } as unknown as ConfigService;
  const payload = {
    sub: 7,
    email: 'a@b.com',
    perfil: 'professor',
    escolaId: 5,
  };

  it('aceita token de conta ativa', async () => {
    const usuarios = { acessoLiberado: jest.fn().mockResolvedValue(true) };
    const s = new JwtStrategy(config, usuarios as unknown as UsuarioService);

    await expect(s.validate(payload)).resolves.toEqual({
      userId: 7,
      email: 'a@b.com',
      perfil: 'professor',
      escolaId: 5,
    });
    expect(usuarios.acessoLiberado).toHaveBeenCalledWith(7);
  });

  it('recusa token de conta ou escola desativada depois do login', async () => {
    const usuarios = { acessoLiberado: jest.fn().mockResolvedValue(false) };
    const s = new JwtStrategy(config, usuarios as unknown as UsuarioService);

    await expect(s.validate(payload)).rejects.toThrow(UnauthorizedException);
  });
});

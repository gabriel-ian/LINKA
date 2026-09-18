import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsuarioService } from '../usuario/usuario.service';
import { Usuario } from '../usuario/usuario.entity';

describe('AuthService', () => {
  let service: AuthService;
  let usuarioService: jest.Mocked<UsuarioService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsuarioService,
          useValue: { findByEmail: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usuarioService = module.get(UsuarioService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('lanca 401 quando o email nao existe, sem revelar o motivo', async () => {
      usuarioService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('naoexiste@linka.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('lanca 401 quando a senha esta errada', async () => {
      usuarioService.findByEmail.mockResolvedValue({
        id: 1,
        email: 'admin@linka.com',
        senha: 'hash-correto',
        perfil: 'admin',
        escolaId: null,
      } as Usuario);
      jest.spyOn(UsuarioService, 'conferirSenha').mockResolvedValue(false);

      await expect(
        service.login('admin@linka.com', 'senha-errada'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('devolve token, perfil e escolaId quando as credenciais conferem', async () => {
      const usuario = {
        id: 1,
        email: 'escola@linka.com',
        senha: 'hash-correto',
        perfil: 'escola',
        escolaId: 5,
      } as Usuario;
      usuarioService.findByEmail.mockResolvedValue(usuario);
      jest.spyOn(UsuarioService, 'conferirSenha').mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token-assinado');

      const resultado = await service.login('escola@linka.com', 'linka123');

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'escola@linka.com',
        perfil: 'escola',
        escolaId: 5,
      });
      expect(resultado).toEqual({
        access_token: 'token-assinado',
        perfil: 'escola',
        escolaId: 5,
      });
    });

    it('devolve escolaId nulo para o admin, que nao pertence a escola', async () => {
      usuarioService.findByEmail.mockResolvedValue({
        id: 1,
        email: 'admin@linka.com',
        senha: 'hash-correto',
        perfil: 'admin',
        escolaId: null,
      } as Usuario);
      jest.spyOn(UsuarioService, 'conferirSenha').mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token-assinado');

      const resultado = await service.login('admin@linka.com', 'linka123');

      expect(resultado.escolaId).toBeNull();
    });
  });
});

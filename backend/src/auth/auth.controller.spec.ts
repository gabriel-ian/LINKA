import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { login: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('repassa email e senha do corpo da requisicao para o service', async () => {
      const resposta = {
        access_token: 'token',
        perfil: 'admin',
        escolaId: null,
      };
      service.login.mockResolvedValue(resposta as never);

      const resultado = await controller.login({
        email: 'admin@linka.com',
        senha: 'linka123',
      });

      expect(service.login).toHaveBeenCalledWith('admin@linka.com', 'linka123');
      expect(resultado).toBe(resposta);
    });
  });
});

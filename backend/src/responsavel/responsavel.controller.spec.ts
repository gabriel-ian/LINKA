import { Test, TestingModule } from '@nestjs/testing';
import { ResponsavelController } from './responsavel.controller';
import { ResponsavelService } from './responsavel.service';

describe('ResponsavelController', () => {
  let controller: ResponsavelController;
  let service: jest.Mocked<ResponsavelService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResponsavelController],
      providers: [
        {
          provide: ResponsavelService,
          useValue: { findAllByEscola: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(ResponsavelController);
    service = module.get(ResponsavelService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delega usando o escolaId do token', async () => {
    const resposta = { data: [] };
    service.findAllByEscola.mockResolvedValue(resposta as never);

    expect(await controller.findAll(1)).toBe(resposta);
    expect(service.findAllByEscola).toHaveBeenCalledWith(1);
  });

  it('create delega para o service (nao recebe escolaId: responsavel nao pertence a escola)', async () => {
    const dto = {
      nomeCompleto: 'Carla',
      email: 'carla@familia.com',
      senha: '123456',
    };
    const resposta = { data: { id: 1, ...dto } };
    service.create.mockResolvedValue(resposta as never);

    expect(await controller.create(dto)).toBe(resposta);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});

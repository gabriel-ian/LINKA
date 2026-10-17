import { Test, TestingModule } from '@nestjs/testing';
import { NeurodivergenciaController } from './neurodivergencia.controller';
import { NeurodivergenciaService } from './neurodivergencia.service';

describe('NeurodivergenciaController', () => {
  let controller: NeurodivergenciaController;
  let service: jest.Mocked<NeurodivergenciaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NeurodivergenciaController],
      providers: [
        {
          provide: NeurodivergenciaService,
          useValue: { findAll: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<NeurodivergenciaController>(
      NeurodivergenciaController,
    );
    service = module.get(NeurodivergenciaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delega para o service', async () => {
    const resposta = { data: [] };
    service.findAll.mockResolvedValue(resposta);

    expect(await controller.findAll()).toBe(resposta);
  });

  it('create delega para o service', async () => {
    const dto = { nome: 'TDAH' };
    const resposta = { data: { id: 1, ...dto } };
    service.create.mockResolvedValue(resposta);

    expect(await controller.create(dto)).toBe(resposta);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});

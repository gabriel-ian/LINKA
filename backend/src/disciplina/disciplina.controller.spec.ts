import { Test, TestingModule } from '@nestjs/testing';
import { DisciplinaController } from './disciplina.controller';
import { DisciplinaService } from './disciplina.service';

describe('DisciplinaController', () => {
  let controller: DisciplinaController;
  let service: jest.Mocked<DisciplinaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisciplinaController],
      providers: [
        {
          provide: DisciplinaService,
          useValue: { findAll: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<DisciplinaController>(DisciplinaController);
    service = module.get(DisciplinaService);
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
    const dto = { nome: 'Matematica' };
    const resposta = { data: { id: 1, ...dto } };
    service.create.mockResolvedValue(resposta);

    expect(await controller.create(dto)).toBe(resposta);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});

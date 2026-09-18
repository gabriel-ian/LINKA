import { Test, TestingModule } from '@nestjs/testing';
import { TarefaController } from './tarefa.controller';
import { TarefaService } from './tarefa.service';

describe('TarefaController', () => {
  let controller: TarefaController;
  let service: jest.Mocked<TarefaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TarefaController],
      providers: [
        {
          provide: TarefaService,
          useValue: { findAllByEscola: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(TarefaController);
    service = module.get(TarefaService);
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

  it('create passa o usuarioId e o escolaId do token, nunca do corpo', async () => {
    const dto = { titulo: 'Lista 1', turmaId: 1, disciplinaId: 2 };
    const resposta = { data: { id: 1, ...dto } };
    service.create.mockResolvedValue(resposta as never);

    expect(await controller.create(dto, 10, 1)).toBe(resposta);
    expect(service.create).toHaveBeenCalledWith(dto, 10, 1);
  });
});

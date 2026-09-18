import { Test, TestingModule } from '@nestjs/testing';
import { TarefaAdaptadaController } from './tarefa-adaptada.controller';
import { TarefaAdaptadaService } from './tarefa-adaptada.service';

describe('TarefaAdaptadaController', () => {
  let controller: TarefaAdaptadaController;
  let service: jest.Mocked<TarefaAdaptadaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TarefaAdaptadaController],
      providers: [
        {
          provide: TarefaAdaptadaService,
          useValue: { findAllByTarefa: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(TarefaAdaptadaController);
    service = module.get(TarefaAdaptadaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllByTarefa delega usando o escolaId do token', async () => {
    const resposta = { data: [] };
    service.findAllByTarefa.mockResolvedValue(resposta as never);

    expect(await controller.findAllByTarefa(1, 2)).toBe(resposta);
    expect(service.findAllByTarefa).toHaveBeenCalledWith(1, 2);
  });

  it('create delega para o service', async () => {
    const dto = {
      tarefaId: 1,
      alunoId: 2,
      descricaoAdaptada: 'Resolva 3 dos 10 exercicios.',
    };
    const resposta = { data: { id: 1, ...dto } };
    service.create.mockResolvedValue(resposta as never);

    expect(await controller.create(dto, 1)).toBe(resposta);
    expect(service.create).toHaveBeenCalledWith(dto, 1);
  });
});

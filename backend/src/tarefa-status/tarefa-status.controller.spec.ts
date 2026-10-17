import { Test, TestingModule } from '@nestjs/testing';
import { TarefaStatusController } from './tarefa-status.controller';
import { TarefaStatusService } from './tarefa-status.service';

describe('TarefaStatusController', () => {
  let controller: TarefaStatusController;
  let service: jest.Mocked<TarefaStatusService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TarefaStatusController],
      providers: [
        {
          provide: TarefaStatusService,
          useValue: {
            findAllByAluno: jest.fn(),
            updateStatus: jest.fn(),
            findAllByResponsavelUsuarioId: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TarefaStatusController);
    service = module.get(TarefaStatusService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllByAluno delega usando o escolaId do token', async () => {
    const resposta = { data: [] };
    service.findAllByAluno.mockResolvedValue(resposta);

    expect(await controller.findAllByAluno(1, 2)).toBe(resposta);
    expect(service.findAllByAluno).toHaveBeenCalledWith(1, 2);
  });

  it('updateStatus delega para o service', async () => {
    const dto = { alunoId: 1, tarefaId: 2, status: 'concluida' as const };
    const resposta = { data: dto };
    service.updateStatus.mockResolvedValue(resposta as never);

    expect(await controller.updateStatus(dto, 1)).toBe(resposta);
    expect(service.updateStatus).toHaveBeenCalledWith(dto, 1);
  });

  it('findAllByResponsavel usa o usuarioId do token, nunca um id do corpo', async () => {
    const resposta = { data: [] };
    service.findAllByResponsavelUsuarioId.mockResolvedValue(resposta);

    expect(await controller.findAllByResponsavel(7)).toBe(resposta);
    expect(service.findAllByResponsavelUsuarioId).toHaveBeenCalledWith(7);
  });
});

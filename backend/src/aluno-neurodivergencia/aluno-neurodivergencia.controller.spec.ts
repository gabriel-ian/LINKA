import { Test, TestingModule } from '@nestjs/testing';
import { AlunoNeurodivergenciaController } from './aluno-neurodivergencia.controller';
import { AlunoNeurodivergenciaService } from './aluno-neurodivergencia.service';

describe('AlunoNeurodivergenciaController', () => {
  let controller: AlunoNeurodivergenciaController;
  let service: jest.Mocked<AlunoNeurodivergenciaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlunoNeurodivergenciaController],
      providers: [
        {
          provide: AlunoNeurodivergenciaService,
          useValue: { findAllByAluno: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(AlunoNeurodivergenciaController);
    service = module.get(AlunoNeurodivergenciaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllByAluno delega usando o escolaId do token', async () => {
    const resposta = { data: [] };
    service.findAllByAluno.mockResolvedValue(resposta as never);

    expect(await controller.findAllByAluno(1, 2)).toBe(resposta);
    expect(service.findAllByAluno).toHaveBeenCalledWith(1, 2);
  });

  it('create delega para o service', async () => {
    const dto = { alunoId: 1, neurodivergenciaId: 2 };
    const resposta = { data: dto };
    service.create.mockResolvedValue(resposta as never);

    expect(await controller.create(dto, 1)).toBe(resposta);
    expect(service.create).toHaveBeenCalledWith(dto, 1);
  });
});

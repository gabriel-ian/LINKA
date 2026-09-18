import { Test, TestingModule } from '@nestjs/testing';
import { AlunoResponsavelController } from './aluno-responsavel.controller';
import { AlunoResponsavelService } from './aluno-responsavel.service';

describe('AlunoResponsavelController', () => {
  let controller: AlunoResponsavelController;
  let service: jest.Mocked<AlunoResponsavelService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlunoResponsavelController],
      providers: [
        {
          provide: AlunoResponsavelService,
          useValue: { findAllByAluno: jest.fn(), create: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(AlunoResponsavelController);
    service = module.get(AlunoResponsavelService);
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
    const dto = { alunoId: 1, responsavelId: 2 };
    const resposta = { data: dto };
    service.create.mockResolvedValue(resposta as never);

    expect(await controller.create(dto, 1)).toBe(resposta);
    expect(service.create).toHaveBeenCalledWith(dto, 1);
  });
});

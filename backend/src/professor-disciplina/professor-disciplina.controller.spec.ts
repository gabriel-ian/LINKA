import { Test, TestingModule } from '@nestjs/testing';
import { ProfessorDisciplinaController } from './professor-disciplina.controller';
import { ProfessorDisciplinaService } from './professor-disciplina.service';

describe('ProfessorDisciplinaController', () => {
  let controller: ProfessorDisciplinaController;
  let service: jest.Mocked<ProfessorDisciplinaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfessorDisciplinaController],
      providers: [
        {
          provide: ProfessorDisciplinaService,
          useValue: {
            findAllByEscola: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(ProfessorDisciplinaController);
    service = module.get(ProfessorDisciplinaService);
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

  it('create delega para o service', async () => {
    const dto = { professorId: 1, disciplinaId: 2 };
    const resposta = { data: dto };
    service.create.mockResolvedValue(resposta as never);

    expect(await controller.create(dto, 1)).toBe(resposta);
    expect(service.create).toHaveBeenCalledWith(dto, 1);
  });

  it('remove delega para o service', async () => {
    const resposta = { data: true };
    service.remove.mockResolvedValue(resposta as never);

    expect(await controller.remove(1, 2, 3)).toBe(resposta);
    expect(service.remove).toHaveBeenCalledWith(1, 2, 3);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TurmaProfessorDisciplinaController } from './turma-professor-disciplina.controller';
import { TurmaProfessorDisciplinaService } from './turma-professor-disciplina.service';

describe('TurmaProfessorDisciplinaController', () => {
  let controller: TurmaProfessorDisciplinaController;
  let service: jest.Mocked<TurmaProfessorDisciplinaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurmaProfessorDisciplinaController],
      providers: [
        {
          provide: TurmaProfessorDisciplinaService,
          useValue: {
            findAllByEscola: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TurmaProfessorDisciplinaController);
    service = module.get(TurmaProfessorDisciplinaService);
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
    const dto = { turmaId: 1, professorId: 2, disciplinaId: 3 };
    const resposta = { data: dto };
    service.create.mockResolvedValue(resposta as never);

    expect(await controller.create(dto, 1)).toBe(resposta);
    expect(service.create).toHaveBeenCalledWith(dto, 1);
  });

  it('remove delega para o service', async () => {
    const resposta = { data: true };
    service.remove.mockResolvedValue(resposta as never);

    expect(await controller.remove(5, 1)).toBe(resposta);
    expect(service.remove).toHaveBeenCalledWith(5, 1);
  });
});

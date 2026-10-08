import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurmaService } from './turma.service';
import { Turma } from './turma.entity';

describe('TurmaService', () => {
  let service: TurmaService;
  let repository: jest.Mocked<Repository<Turma>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurmaService,
        {
          provide: getRepositoryToken(Turma),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TurmaService>(TurmaService);
    repository = module.get(getRepositoryToken(Turma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByEscola', () => {
    it('busca apenas turmas da escola informada, ordenadas por nome', async () => {
      const turmas = [{ id: 1, nome: 'Turma A' }] as Turma[];
      repository.find.mockResolvedValue(turmas);

      const resultado = await service.findAllByEscola(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { escolaId: 1 },
        order: { nome: 'ASC' },
      });
      expect(resultado).toEqual({ data: turmas });
    });
  });

  describe('create', () => {
    it('cria a turma vinculada a escola logada', async () => {
      const criada = { nome: 'Turma B', escolaId: 3 } as Turma;
      const salva = { ...criada, id: 9 };
      repository.create.mockReturnValue(criada);
      repository.save.mockResolvedValue(salva);

      const resultado = await service.create({ nome: 'Turma B' }, 3);

      expect(repository.create).toHaveBeenCalledWith({
        nome: 'Turma B',
        escolaId: 3,
      });
      expect(repository.save).toHaveBeenCalledWith(criada);
      expect(resultado).toEqual({ data: salva });
    });
  });
});

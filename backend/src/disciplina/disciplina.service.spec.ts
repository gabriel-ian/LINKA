import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DisciplinaService } from './disciplina.service';
import { Disciplina } from './disciplina.entity';

describe('DisciplinaService', () => {
  let service: DisciplinaService;
  let repository: jest.Mocked<Repository<Disciplina>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisciplinaService,
        {
          provide: getRepositoryToken(Disciplina),
          useValue: { find: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<DisciplinaService>(DisciplinaService);
    repository = module.get(getRepositoryToken(Disciplina));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('lista disciplinas ordenadas por nome', async () => {
      const disciplinas = [{ id: 1, nome: 'Matematica' }] as Disciplina[];
      repository.find.mockResolvedValue(disciplinas);

      const resultado = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({ order: { nome: 'ASC' } });
      expect(resultado).toEqual({ data: disciplinas });
    });
  });

  describe('create', () => {
    it('cria a disciplina', async () => {
      const criada = { nome: 'Portugues' } as Disciplina;
      const salva = { ...criada, id: 1 } as Disciplina;
      repository.create.mockReturnValue(criada);
      repository.save.mockResolvedValue(salva);

      const resultado = await service.create({ nome: 'Portugues' });

      expect(repository.create).toHaveBeenCalledWith({ nome: 'Portugues' });
      expect(resultado).toEqual({ data: salva });
    });
  });
});

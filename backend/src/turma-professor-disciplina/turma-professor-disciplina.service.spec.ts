import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TurmaProfessorDisciplinaService } from './turma-professor-disciplina.service';
import { TurmaProfessorDisciplina } from './turma-professor-disciplina.entity';
import { Turma } from '../turma/turma.entity';
import { Professor } from '../professor/professor.entity';
import { Disciplina } from '../disciplina/disciplina.entity';

describe('TurmaProfessorDisciplinaService', () => {
  let service: TurmaProfessorDisciplinaService;
  let alocacaoRepo: jest.Mocked<Repository<TurmaProfessorDisciplina>>;
  let turmaRepo: jest.Mocked<Repository<Turma>>;
  let professorRepo: jest.Mocked<Repository<Professor>>;
  let disciplinaRepo: jest.Mocked<Repository<Disciplina>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurmaProfessorDisciplinaService,
        {
          provide: getRepositoryToken(TurmaProfessorDisciplina),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Turma),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Professor),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Disciplina),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(TurmaProfessorDisciplinaService);
    alocacaoRepo = module.get(getRepositoryToken(TurmaProfessorDisciplina));
    turmaRepo = module.get(getRepositoryToken(Turma));
    professorRepo = module.get(getRepositoryToken(Professor));
    disciplinaRepo = module.get(getRepositoryToken(Disciplina));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { turmaId: 1, professorId: 2, disciplinaId: 3 };

    it('rejeita se a turma nao e da escola logada', async () => {
      turmaRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita se o professor nao e da escola logada', async () => {
      turmaRepo.findOne.mockResolvedValue({ id: 1 } as Turma);
      professorRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });

    it('rejeita se a disciplina nao existe', async () => {
      turmaRepo.findOne.mockResolvedValue({ id: 1 } as Turma);
      professorRepo.findOne.mockResolvedValue({ id: 2 } as Professor);
      disciplinaRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });

    it('rejeita alocacao duplicada', async () => {
      turmaRepo.findOne.mockResolvedValue({ id: 1 } as Turma);
      professorRepo.findOne.mockResolvedValue({ id: 2 } as Professor);
      disciplinaRepo.findOne.mockResolvedValue({ id: 3 } as Disciplina);
      alocacaoRepo.findOne.mockResolvedValue({
        id: 10,
      } as TurmaProfessorDisciplina);

      await expect(service.create(dto, 1)).rejects.toThrow(
        'Esta alocacao ja existe',
      );
    });

    it('cria a alocacao quando tudo e valido', async () => {
      turmaRepo.findOne.mockResolvedValue({ id: 1 } as Turma);
      professorRepo.findOne.mockResolvedValue({ id: 2 } as Professor);
      disciplinaRepo.findOne.mockResolvedValue({ id: 3 } as Disciplina);
      alocacaoRepo.findOne.mockResolvedValue(null);
      const criada = {
        id: 10,
        turmaId: 1,
        professorId: 2,
        disciplinaId: 3,
      } as TurmaProfessorDisciplina;
      alocacaoRepo.create.mockReturnValue(criada);
      alocacaoRepo.save.mockResolvedValue(criada);

      const resultado = await service.create(dto, 1);

      expect(resultado).toEqual({ data: criada });
    });
  });

  describe('findAllByEscola', () => {
    it('busca alocacoes filtrando pela escola da turma', async () => {
      const alocacoes = [{ id: 1 }] as TurmaProfessorDisciplina[];
      alocacaoRepo.find.mockResolvedValue(alocacoes);

      const resultado = await service.findAllByEscola(1);

      expect(alocacaoRepo.find).toHaveBeenCalledWith({
        where: { turma: { escolaId: 1 } },
        relations: { turma: true, professor: true, disciplina: true },
      });
      expect(resultado).toEqual({ data: alocacoes });
    });
  });

  describe('remove', () => {
    it('rejeita se a alocacao nao e da escola logada', async () => {
      alocacaoRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 99)).rejects.toThrow(BadRequestException);
      expect(alocacaoRepo.delete).not.toHaveBeenCalled();
    });

    it('remove a alocacao quando e da escola', async () => {
      alocacaoRepo.findOne.mockResolvedValue({
        id: 1,
      } as TurmaProfessorDisciplina);

      const resultado = await service.remove(1, 1);

      expect(alocacaoRepo.delete).toHaveBeenCalledWith(1);
      expect(resultado).toEqual({ data: true });
    });
  });
});

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfessorDisciplinaService } from './professor-disciplina.service';
import { ProfessorDisciplina } from './professor-disciplina.entity';
import { Professor } from '../professor/professor.entity';
import { Disciplina } from '../disciplina/disciplina.entity';

describe('ProfessorDisciplinaService', () => {
  let service: ProfessorDisciplinaService;
  let vinculoRepo: jest.Mocked<Repository<ProfessorDisciplina>>;
  let professorRepo: jest.Mocked<Repository<Professor>>;
  let disciplinaRepo: jest.Mocked<Repository<Disciplina>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessorDisciplinaService,
        {
          provide: getRepositoryToken(ProfessorDisciplina),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
          },
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

    service = module.get(ProfessorDisciplinaService);
    vinculoRepo = module.get(getRepositoryToken(ProfessorDisciplina));
    professorRepo = module.get(getRepositoryToken(Professor));
    disciplinaRepo = module.get(getRepositoryToken(Disciplina));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { professorId: 1, disciplinaId: 2 };

    it('rejeita se o professor nao e da escola logada', async () => {
      professorRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita se a disciplina nao existe', async () => {
      professorRepo.findOne.mockResolvedValue({ id: 1 } as Professor);
      disciplinaRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });

    it('rejeita vinculo duplicado', async () => {
      professorRepo.findOne.mockResolvedValue({ id: 1 } as Professor);
      disciplinaRepo.findOne.mockResolvedValue({ id: 2 } as Disciplina);
      vinculoRepo.findOne.mockResolvedValue({
        professorId: 1,
        disciplinaId: 2,
      } as ProfessorDisciplina);

      await expect(service.create(dto, 1)).rejects.toThrow(
        'Professor ja habilitado nesta disciplina',
      );
    });

    it('cria o vinculo quando tudo e valido', async () => {
      professorRepo.findOne.mockResolvedValue({ id: 1 } as Professor);
      disciplinaRepo.findOne.mockResolvedValue({ id: 2 } as Disciplina);
      vinculoRepo.findOne.mockResolvedValue(null);
      const criado = { professorId: 1, disciplinaId: 2 } as ProfessorDisciplina;
      vinculoRepo.create.mockReturnValue(criado);
      vinculoRepo.save.mockResolvedValue(criado);

      const resultado = await service.create(dto, 1);

      expect(resultado).toEqual({ data: criado });
    });
  });

  describe('findAllByEscola', () => {
    it('busca vinculos filtrando pela escola do professor', async () => {
      const vinculos = [
        { professorId: 1, disciplinaId: 2 },
      ] as ProfessorDisciplina[];
      vinculoRepo.find.mockResolvedValue(vinculos);

      const resultado = await service.findAllByEscola(1);

      expect(vinculoRepo.find).toHaveBeenCalledWith({
        where: { professor: { escolaId: 1 } },
        relations: { professor: true, disciplina: true },
      });
      expect(resultado).toEqual({ data: vinculos });
    });
  });

  describe('remove', () => {
    it('rejeita se o professor nao e da escola logada', async () => {
      professorRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(1, 2, 99)).rejects.toThrow(
        BadRequestException,
      );
      expect(vinculoRepo.delete).not.toHaveBeenCalled();
    });

    it('remove o vinculo quando o professor e da escola', async () => {
      professorRepo.findOne.mockResolvedValue({ id: 1 } as Professor);

      const resultado = await service.remove(1, 2, 1);

      expect(vinculoRepo.delete).toHaveBeenCalledWith({
        professorId: 1,
        disciplinaId: 2,
      });
      expect(resultado).toEqual({ data: true });
    });
  });
});

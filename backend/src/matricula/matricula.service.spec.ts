import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatriculaService } from './matricula.service';
import { Matricula } from './matricula.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Turma } from '../turma/turma.entity';

describe('MatriculaService', () => {
  let service: MatriculaService;
  let matriculaRepo: jest.Mocked<Repository<Matricula>>;
  let alunoRepo: jest.Mocked<Repository<Aluno>>;
  let turmaRepo: jest.Mocked<Repository<Turma>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatriculaService,
        {
          provide: getRepositoryToken(Matricula),
          useValue: { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
        {
          provide: getRepositoryToken(Aluno),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Turma),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<MatriculaService>(MatriculaService);
    matriculaRepo = module.get(getRepositoryToken(Matricula));
    alunoRepo = module.get(getRepositoryToken(Aluno));
    turmaRepo = module.get(getRepositoryToken(Turma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { alunoId: 1, turmaId: 2 };

    it('rejeita se o aluno nao pertence a escola logada', async () => {
      alunoRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 99)).rejects.toThrow(
        BadRequestException,
      );
      expect(alunoRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, escolaId: 99 },
      });
    });

    it('rejeita se a turma nao pertence a escola logada', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      turmaRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita matricula duplicada', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      turmaRepo.findOne.mockResolvedValue({ id: 2 } as Turma);
      matriculaRepo.findOne.mockResolvedValue({
        alunoId: 1,
        turmaId: 2,
      } as Matricula);

      await expect(service.create(dto, 1)).rejects.toThrow(
        'Aluno ja matriculado nesta turma',
      );
      expect(matriculaRepo.create).not.toHaveBeenCalled();
    });

    it('matricula o aluno na turma quando tudo e valido', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      turmaRepo.findOne.mockResolvedValue({ id: 2 } as Turma);
      matriculaRepo.findOne.mockResolvedValue(null);
      const criada = { alunoId: 1, turmaId: 2 } as Matricula;
      matriculaRepo.create.mockReturnValue(criada);
      matriculaRepo.save.mockResolvedValue(criada);

      const resultado = await service.create(dto, 1);

      expect(matriculaRepo.create).toHaveBeenCalledWith({
        alunoId: 1,
        turmaId: 2,
      });
      expect(resultado).toEqual({ data: criada });
    });
  });

  describe('findAllByEscola', () => {
    it('busca matriculas das turmas da escola, com aluno e turma', async () => {
      const matriculas = [{ alunoId: 1, turmaId: 2 }] as Matricula[];
      matriculaRepo.find.mockResolvedValue(matriculas);

      const resultado = await service.findAllByEscola(1);

      expect(matriculaRepo.find).toHaveBeenCalledWith({
        where: { turma: { escolaId: 1 } },
        relations: { aluno: true, turma: true },
      });
      expect(resultado).toEqual({ data: matriculas });
    });
  });
});

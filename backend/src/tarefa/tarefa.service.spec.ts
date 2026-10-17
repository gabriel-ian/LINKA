import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TarefaService } from './tarefa.service';
import { Tarefa } from './tarefa.entity';
import { Turma } from '../turma/turma.entity';
import { Disciplina } from '../disciplina/disciplina.entity';
import { Professor } from '../professor/professor.entity';
import { TarefaStatusService } from '../tarefa-status/tarefa-status.service';

describe('TarefaService', () => {
  let service: TarefaService;
  let tarefaRepo: jest.Mocked<Repository<Tarefa>>;
  let turmaRepo: jest.Mocked<Repository<Turma>>;
  let disciplinaRepo: jest.Mocked<Repository<Disciplina>>;
  let professorRepo: jest.Mocked<Repository<Professor>>;
  let tarefaStatusService: jest.Mocked<TarefaStatusService>;
  // EntityManager da transacao: o save da tarefa passa por ele.
  let manager: { save: jest.Mock };

  beforeEach(async () => {
    manager = { save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((cb: (m: unknown) => unknown) => cb(manager)),
          },
        },
        TarefaService,
        {
          provide: getRepositoryToken(Tarefa),
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Turma),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Disciplina),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Professor),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: TarefaStatusService,
          useValue: { seedParaTurma: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(TarefaService);
    tarefaRepo = module.get(getRepositoryToken(Tarefa));
    turmaRepo = module.get(getRepositoryToken(Turma));
    disciplinaRepo = module.get(getRepositoryToken(Disciplina));
    professorRepo = module.get(getRepositoryToken(Professor));
    tarefaStatusService = module.get(TarefaStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { titulo: 'Lista 1', turmaId: 1, disciplinaId: 2 };

    it('rejeita se o usuario logado nao e professor desta escola', async () => {
      professorRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 10, 99)).rejects.toThrow(
        BadRequestException,
      );
      expect(professorRepo.findOne).toHaveBeenCalledWith({
        where: { usuarioId: 10, escolaId: 99 },
      });
    });

    it('rejeita se a turma nao e da escola logada', async () => {
      professorRepo.findOne.mockResolvedValue({ id: 5 } as Professor);
      turmaRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 10, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita se a disciplina nao existe', async () => {
      professorRepo.findOne.mockResolvedValue({ id: 5 } as Professor);
      turmaRepo.findOne.mockResolvedValue({ id: 1 } as Turma);
      disciplinaRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 10, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('resolve o professor pelo usuarioId do token, nao pelo corpo', async () => {
      professorRepo.findOne.mockResolvedValue({ id: 5 } as Professor);
      turmaRepo.findOne.mockResolvedValue({ id: 1 } as Turma);
      disciplinaRepo.findOne.mockResolvedValue({ id: 2 } as Disciplina);
      const criada = { id: 100, titulo: dto.titulo, professorId: 5 } as Tarefa;
      tarefaRepo.create.mockReturnValue(criada);
      manager.save.mockResolvedValue(criada);

      const resultado = await service.create(dto, 10, 1);

      expect(tarefaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          professorId: 5,
          turmaId: 1,
          disciplinaId: 2,
        }),
      );
      expect(resultado).toEqual({ data: criada });
    });

    it('semeia o status pendente para os alunos matriculados na turma', async () => {
      professorRepo.findOne.mockResolvedValue({ id: 5 } as Professor);
      turmaRepo.findOne.mockResolvedValue({ id: 1 } as Turma);
      disciplinaRepo.findOne.mockResolvedValue({ id: 2 } as Disciplina);
      const criada = { id: 100 } as Tarefa;
      tarefaRepo.create.mockReturnValue(criada);
      manager.save.mockResolvedValue(criada);

      await service.create(dto, 10, 1);

      expect(tarefaStatusService.seedParaTurma).toHaveBeenCalledWith(
        100,
        1,
        manager,
      );
    });

    it('nao devolve a tarefa se o seed dos status falhar (transacao)', async () => {
      professorRepo.findOne.mockResolvedValue({ id: 5 } as Professor);
      turmaRepo.findOne.mockResolvedValue({ id: 1 } as Turma);
      disciplinaRepo.findOne.mockResolvedValue({ id: 2 } as Disciplina);
      const criada = { id: 100 } as Tarefa;
      tarefaRepo.create.mockReturnValue(criada);
      manager.save.mockResolvedValue(criada);
      tarefaStatusService.seedParaTurma.mockRejectedValue(new Error('falhou'));

      await expect(service.create(dto, 10, 1)).rejects.toThrow('falhou');
    });
  });

  describe('findAllByEscola', () => {
    it('busca tarefas filtrando pela escola da turma, mais recentes primeiro', async () => {
      const tarefas = [{ id: 1 }] as Tarefa[];
      tarefaRepo.find.mockResolvedValue(tarefas);

      const resultado = await service.findAllByEscola(1);

      expect(tarefaRepo.find).toHaveBeenCalledWith({
        where: { turma: { escolaId: 1 } },
        relations: { turma: true, disciplina: true, professor: true },
        order: { criado_em: 'DESC' },
      });
      expect(resultado).toEqual({ data: tarefas });
    });
  });
});

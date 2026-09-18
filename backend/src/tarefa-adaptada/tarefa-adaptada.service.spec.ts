import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarefaAdaptadaService } from './tarefa-adaptada.service';
import { TarefaAdaptada } from './tarefa-adaptada.entity';
import { Tarefa } from '../tarefa/tarefa.entity';
import { Aluno } from '../aluno/aluno.entity';

describe('TarefaAdaptadaService', () => {
  let service: TarefaAdaptadaService;
  let adaptadaRepo: jest.Mocked<Repository<TarefaAdaptada>>;
  let tarefaRepo: jest.Mocked<Repository<Tarefa>>;
  let alunoRepo: jest.Mocked<Repository<Aluno>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TarefaAdaptadaService,
        {
          provide: getRepositoryToken(TarefaAdaptada),
          useValue: { create: jest.fn(), save: jest.fn(), find: jest.fn() },
        },
        { provide: getRepositoryToken(Tarefa), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Aluno), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get(TarefaAdaptadaService);
    adaptadaRepo = module.get(getRepositoryToken(TarefaAdaptada));
    tarefaRepo = module.get(getRepositoryToken(Tarefa));
    alunoRepo = module.get(getRepositoryToken(Aluno));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      tarefaId: 1,
      alunoId: 2,
      descricaoAdaptada: 'Resolva 3 dos 10 exercicios.',
    };

    it('rejeita se a tarefa nao e da escola logada', async () => {
      tarefaRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 99)).rejects.toThrow(
        BadRequestException,
      );
      expect(tarefaRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1, turma: { escolaId: 99 } },
      });
    });

    it('rejeita se o aluno nao e da escola logada', async () => {
      tarefaRepo.findOne.mockResolvedValue({ id: 1 } as Tarefa);
      alunoRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('usa gerado_por_ia = true por default', async () => {
      tarefaRepo.findOne.mockResolvedValue({ id: 1 } as Tarefa);
      alunoRepo.findOne.mockResolvedValue({ id: 2 } as Aluno);
      const criada = { id: 10, tarefaId: 1, alunoId: 2 } as TarefaAdaptada;
      adaptadaRepo.create.mockReturnValue(criada);
      adaptadaRepo.save.mockResolvedValue(criada);

      await service.create(dto, 1);

      expect(adaptadaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ gerado_por_ia: true }),
      );
    });

    it('respeita gerado_por_ia = false quando informado', async () => {
      tarefaRepo.findOne.mockResolvedValue({ id: 1 } as Tarefa);
      alunoRepo.findOne.mockResolvedValue({ id: 2 } as Aluno);
      const criada = { id: 10 } as TarefaAdaptada;
      adaptadaRepo.create.mockReturnValue(criada);
      adaptadaRepo.save.mockResolvedValue(criada);

      await service.create({ ...dto, geradoPorIa: false }, 1);

      expect(adaptadaRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ gerado_por_ia: false }),
      );
    });
  });

  describe('findAllByTarefa', () => {
    it('rejeita se a tarefa nao e da escola logada', async () => {
      tarefaRepo.findOne.mockResolvedValue(null);

      await expect(service.findAllByTarefa(1, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lista as adaptacoes da tarefa', async () => {
      tarefaRepo.findOne.mockResolvedValue({ id: 1 } as Tarefa);
      const adaptacoes = [{ id: 10 }] as TarefaAdaptada[];
      adaptadaRepo.find.mockResolvedValue(adaptacoes);

      const resultado = await service.findAllByTarefa(1, 1);

      expect(adaptadaRepo.find).toHaveBeenCalledWith({
        where: { tarefaId: 1 },
        relations: { aluno: true },
      });
      expect(resultado).toEqual({ data: adaptacoes });
    });
  });
});

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TarefaStatusService } from './tarefa-status.service';
import { TarefaStatusEntity } from './tarefa-status.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Tarefa } from '../tarefa/tarefa.entity';
import { Matricula } from '../matricula/matricula.entity';
import { Responsavel } from '../responsavel/responsavel.entity';

describe('TarefaStatusService', () => {
  let service: TarefaStatusService;
  let statusRepo: jest.Mocked<Repository<TarefaStatusEntity>>;
  let alunoRepo: jest.Mocked<Repository<Aluno>>;
  let tarefaRepo: jest.Mocked<Repository<Tarefa>>;
  let matriculaRepo: jest.Mocked<Repository<Matricula>>;
  let responsavelRepo: jest.Mocked<Repository<Responsavel>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TarefaStatusService,
        {
          provide: getRepositoryToken(TarefaStatusEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Aluno),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Tarefa),
          useValue: { find: jest.fn(), findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Matricula),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Responsavel),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(TarefaStatusService);
    statusRepo = module.get(getRepositoryToken(TarefaStatusEntity));
    alunoRepo = module.get(getRepositoryToken(Aluno));
    tarefaRepo = module.get(getRepositoryToken(Tarefa));
    matriculaRepo = module.get(getRepositoryToken(Matricula));
    responsavelRepo = module.get(getRepositoryToken(Responsavel));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seedParaTurma', () => {
    it('nao faz nada se a turma nao tem matriculados', async () => {
      matriculaRepo.find.mockResolvedValue([]);

      await service.seedParaTurma(1, 1);

      expect(statusRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('insere uma linha pendente por aluno matriculado, ignorando duplicatas', async () => {
      matriculaRepo.find.mockResolvedValue([
        { alunoId: 1, turmaId: 1 },
        { alunoId: 2, turmaId: 1 },
      ] as Matricula[]);

      const qb = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orIgnore: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      statusRepo.createQueryBuilder.mockReturnValue(qb as never);

      await service.seedParaTurma(10, 1);

      expect(matriculaRepo.find).toHaveBeenCalledWith({
        where: { turmaId: 1 },
      });
      expect(qb.values).toHaveBeenCalledWith([
        { alunoId: 1, tarefaId: 10, status: 'pendente' },
        { alunoId: 2, tarefaId: 10, status: 'pendente' },
      ]);
      expect(qb.orIgnore).toHaveBeenCalled();
    });
  });

  describe('seedParaAluno', () => {
    it('nao faz nada se a turma ainda nao tem tarefas', async () => {
      tarefaRepo.find.mockResolvedValue([]);

      await service.seedParaAluno(1, 1);

      expect(statusRepo.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('insere uma linha pendente por tarefa da turma, ignorando duplicatas', async () => {
      tarefaRepo.find.mockResolvedValue([{ id: 10 }, { id: 11 }] as Tarefa[]);

      const qb = {
        insert: jest.fn().mockReturnThis(),
        into: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orIgnore: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      };
      statusRepo.createQueryBuilder.mockReturnValue(qb as never);

      await service.seedParaAluno(3, 1);

      expect(tarefaRepo.find).toHaveBeenCalledWith({ where: { turmaId: 1 } });
      expect(qb.values).toHaveBeenCalledWith([
        { alunoId: 3, tarefaId: 10, status: 'pendente' },
        { alunoId: 3, tarefaId: 11, status: 'pendente' },
      ]);
      expect(qb.orIgnore).toHaveBeenCalled();
    });

    it('usa os repositorios do manager quando chamado dentro de transacao', async () => {
      const tarefaRepoTx = { find: jest.fn().mockResolvedValue([]) };
      const manager = {
        getRepository: jest.fn().mockReturnValue(tarefaRepoTx),
      };

      await service.seedParaAluno(3, 1, manager as never);

      expect(manager.getRepository).toHaveBeenCalledWith(Tarefa);
      expect(tarefaRepoTx.find).toHaveBeenCalled();
      expect(tarefaRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('findAllByAluno', () => {
    it('rejeita se o aluno nao e da escola logada', async () => {
      alunoRepo.findOne.mockResolvedValue(null);

      await expect(service.findAllByAluno(1, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lista o status das tarefas do aluno', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      const linhas = [{ alunoId: 1, tarefaId: 10 }] as TarefaStatusEntity[];
      statusRepo.find.mockResolvedValue(linhas);

      const resultado = await service.findAllByAluno(1, 1);

      expect(statusRepo.find).toHaveBeenCalledWith({
        where: { alunoId: 1 },
        relations: { tarefa: true },
      });
      expect(resultado).toEqual({ data: linhas });
    });
  });

  describe('updateStatus', () => {
    const dto = { alunoId: 1, tarefaId: 10, status: 'concluida' as const };

    it('rejeita se o aluno nao e da escola logada', async () => {
      alunoRepo.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(dto, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita se a tarefa nao e da escola logada', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      tarefaRepo.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(dto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('atualiza a linha existente e preenche concluido_em ao concluir', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      tarefaRepo.findOne.mockResolvedValue({ id: 10 } as Tarefa);
      const existente = {
        alunoId: 1,
        tarefaId: 10,
        status: 'pendente',
        concluido_em: null,
      } as TarefaStatusEntity;
      statusRepo.findOne.mockResolvedValue(existente);
      statusRepo.save.mockImplementation((e) =>
        Promise.resolve(e as TarefaStatusEntity),
      );

      const resultado = await service.updateStatus(dto, 1);

      expect(resultado.data.status).toBe('concluida');
      expect(resultado.data.concluido_em).toBeInstanceOf(Date);
    });

    it('zera concluido_em ao voltar para pendente', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      tarefaRepo.findOne.mockResolvedValue({ id: 10 } as Tarefa);
      const existente = {
        alunoId: 1,
        tarefaId: 10,
        status: 'concluida',
        concluido_em: new Date(),
      } as TarefaStatusEntity;
      statusRepo.findOne.mockResolvedValue(existente);
      statusRepo.save.mockImplementation((e) =>
        Promise.resolve(e as TarefaStatusEntity),
      );

      const resultado = await service.updateStatus(
        { ...dto, status: 'pendente' },
        1,
      );

      expect(resultado.data.status).toBe('pendente');
      expect(resultado.data.concluido_em).toBeNull();
    });

    it('cria a linha se ela nao existir ainda (matricula feita depois da tarefa)', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      tarefaRepo.findOne.mockResolvedValue({ id: 10 } as Tarefa);
      statusRepo.findOne.mockResolvedValue(null);
      const nova = { alunoId: 1, tarefaId: 10 } as TarefaStatusEntity;
      statusRepo.create.mockReturnValue(nova);
      statusRepo.save.mockResolvedValue(nova);

      const resultado = await service.updateStatus(dto, 1);

      expect(statusRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          alunoId: 1,
          tarefaId: 10,
          status: 'concluida',
        }),
      );
      expect(resultado).toEqual({ data: nova });
    });
  });

  describe('findAllByResponsavelUsuarioId', () => {
    it('rejeita se o usuario logado nao e um responsavel', async () => {
      responsavelRepo.findOne.mockResolvedValue(null);

      await expect(service.findAllByResponsavelUsuarioId(10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lista o status das tarefas dos alunos vinculados ao responsavel', async () => {
      responsavelRepo.findOne.mockResolvedValue({ id: 5 } as Responsavel);
      const linhas = [{ alunoId: 1, tarefaId: 10 }];
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(linhas),
      };
      statusRepo.createQueryBuilder.mockReturnValue(qb as never);

      const resultado = await service.findAllByResponsavelUsuarioId(10);

      expect(qb.where).toHaveBeenCalledWith(
        'vinculo.responsavel_id = :responsavelId',
        { responsavelId: 5 },
      );
      expect(resultado).toEqual({ data: linhas });
    });
  });
});

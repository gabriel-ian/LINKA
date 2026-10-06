import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EscolaService } from './escola.service';
import { Escola } from './escola.entity';
import { Usuario } from '../usuario/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { Aluno } from '../aluno/aluno.entity';
import { Professor } from '../professor/professor.entity';
import { Turma } from '../turma/turma.entity';

/** Query builder falso que devolve as linhas de contagem informadas. */
function queryBuilderCom(linhas: { escolaId: number; total: string }[]) {
  const qb: any = {};
  for (const m of ['select', 'addSelect', 'where', 'andWhere', 'groupBy']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getRawMany = jest.fn().mockResolvedValue(linhas);
  return qb;
}

describe('EscolaService', () => {
  let service: EscolaService;
  let repository: jest.Mocked<Repository<Escola>>;
  let usuarioRepo: Record<string, jest.Mock>;
  let escolaRepoTx: Record<string, jest.Mock>;
  let contagens: Map<unknown, ReturnType<typeof queryBuilderCom>>;

  beforeEach(async () => {
    usuarioRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((dados) => dados),
      save: jest.fn(async (dados) => ({ id: 99, ...dados })),
      update: jest.fn(),
    };
    escolaRepoTx = {
      create: jest.fn((dados) => dados),
      save: jest.fn(async (dados) => ({ id: 2, ...dados })),
      update: jest.fn(),
    };
    contagens = new Map<unknown, ReturnType<typeof queryBuilderCom>>([
      [Aluno, queryBuilderCom([])],
      [Professor, queryBuilderCom([])],
      [Turma, queryBuilderCom([])],
    ]);

    const getRepository = jest.fn((entidade) => {
      if (entidade === Usuario) return usuarioRepo;
      if (entidade === Escola) return escolaRepoTx;
      return { createQueryBuilder: () => contagens.get(entidade) };
    });

    const dataSource = {
      getRepository,
      transaction: jest.fn(async (fn) => fn({ getRepository })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscolaService,
        {
          provide: getRepositoryToken(Escola),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<EscolaService>(EscolaService);
    repository = module.get(getRepositoryToken(Escola));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('lista as escolas por nome com login, pendencia e contagens', async () => {
      repository.find.mockResolvedValue([
        { id: 1, nome: 'Escola A', ativo: true },
        { id: 2, nome: 'Escola B', ativo: true },
      ] as Escola[]);
      usuarioRepo.find.mockResolvedValue([
        { escolaId: 1, email: 'a@escola.com', ultimoLogin: new Date() },
        { escolaId: 2, email: 'b@escola.com', ultimoLogin: null },
      ]);
      contagens.set(Aluno, queryBuilderCom([{ escolaId: 1, total: '96' }]));
      contagens.set(Professor, queryBuilderCom([{ escolaId: 1, total: '8' }]));

      const { data } = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({ order: { nome: 'ASC' } });
      expect(data[0]).toMatchObject({
        id: 1,
        email: 'a@escola.com',
        pendente: false,
        totalAlunosNee: 96,
        totalProfessores: 8,
        totalTurmas: 0,
      });
      expect(data[1]).toMatchObject({ id: 2, pendente: true, totalAlunosNee: 0 });
    });

    it('nao consulta contagens quando nao ha escolas', async () => {
      repository.find.mockResolvedValue([]);

      const resultado = await service.findAll();

      expect(resultado).toEqual({ data: [] });
      expect(usuarioRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('devolve a escola detalhada quando encontrada', async () => {
      repository.findOne.mockResolvedValue({ id: 1, nome: 'Escola A', ativo: true } as Escola);

      const resultado = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(resultado.data).toMatchObject({ id: 1, nome: 'Escola A', email: null });
    });

    it('lanca NotFoundException quando a escola nao existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dados = {
      nome: 'Nova Escola',
      cidade: 'Pato Branco',
      uf: 'PR',
      email: 'nova@escola.com',
      senha: 'senhaSegura1',
    };

    it('cria a escola e o login (perfil escola) com a senha em hash', async () => {
      jest.spyOn(UsuarioService, 'hashSenha').mockResolvedValue('hash');
      repository.findOne.mockResolvedValue({ id: 2, nome: 'Nova Escola', ativo: true } as Escola);

      const resultado = await service.create(dados);

      expect(escolaRepoTx.create).toHaveBeenCalledWith({
        nome: 'Nova Escola',
        cidade: 'Pato Branco',
        uf: 'PR',
        cnpj: null,
      });
      expect(usuarioRepo.create).toHaveBeenCalledWith({
        email: 'nova@escola.com',
        senha: 'hash',
        perfil: 'escola',
        escolaId: 2,
      });
      expect(resultado.data.id).toBe(2);
    });

    it('recusa e-mail ja usado por outro usuario', async () => {
      usuarioRepo.findOne.mockResolvedValue({ id: 5 });

      await expect(service.create(dados)).rejects.toThrow(BadRequestException);
      expect(escolaRepoTx.save).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('atualiza os dados e registra quem alterou', async () => {
      repository.findOne.mockResolvedValue({ id: 1, nome: 'Escola B', ativo: true } as Escola);

      await service.update(1, { nome: 'Escola B' }, 'admin@linka.com');

      expect(escolaRepoTx.update).toHaveBeenCalledWith(1, {
        nome: 'Escola B',
        atualizadoEm: expect.any(Date),
        atualizadoPor: 'admin@linka.com',
      });
      expect(usuarioRepo.update).not.toHaveBeenCalled();
    });

    it('troca o e-mail do login da escola', async () => {
      repository.findOne.mockResolvedValue({ id: 1, ativo: true } as Escola);
      usuarioRepo.findOne
        .mockResolvedValueOnce({ id: 10, escolaId: 1 })
        .mockResolvedValueOnce(null);

      await service.update(1, { email: 'novo@escola.com' });

      expect(usuarioRepo.update).toHaveBeenCalledWith(10, { email: 'novo@escola.com' });
    });

    it('lanca NotFoundException se a escola nao existir', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { nome: 'Escola B' })).rejects.toThrow(
        NotFoundException,
      );
      expect(escolaRepoTx.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('desativa a escola (soft delete) com a data de hoje', async () => {
      repository.findOne.mockResolvedValue({ id: 1 } as Escola);

      const resultado = await service.remove(1);

      expect(repository.update).toHaveBeenCalledWith(1, {
        ativo: false,
        desativadaEm: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });
      expect(resultado).toEqual({ data: true });
    });
  });

  describe('desativar', () => {
    it('grava motivo, data e observacao', async () => {
      repository.findOne.mockResolvedValue({ id: 1, ativo: true } as Escola);

      await service.desativar(
        1,
        { motivo: 'Fim do contrato', data: '2026-06-30', observacao: '  ' },
        'admin@linka.com',
      );

      expect(repository.update).toHaveBeenCalledWith(1, {
        ativo: false,
        desativadaEm: '2026-06-30',
        motivoDesativacao: 'Fim do contrato',
        observacaoDesativacao: null,
        atualizadoEm: expect.any(Date),
        atualizadoPor: 'admin@linka.com',
      });
    });

    it('recusa escola ja desativada', async () => {
      repository.findOne.mockResolvedValue({ id: 1, ativo: false } as Escola);

      await expect(
        service.desativar(1, { motivo: 'Outro', data: '2026-06-30' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('activate', () => {
    it('reativa a escola e limpa os dados da desativacao', async () => {
      repository.findOne.mockResolvedValue({ id: 1 } as Escola);

      const resultado = await service.activate(1);

      expect(repository.update).toHaveBeenCalledWith(1, {
        ativo: true,
        desativadaEm: null,
        motivoDesativacao: null,
        observacaoDesativacao: null,
        atualizadoEm: expect.any(Date),
        atualizadoPor: null,
      });
      expect(resultado).toEqual({ data: true });
    });
  });
});

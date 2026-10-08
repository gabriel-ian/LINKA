import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ResponsavelService } from './responsavel.service';
import { Responsavel } from './responsavel.entity';
import { Usuario } from '../usuario/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { CreateResponsavelDto } from './dto/create-responsavel.dto';

describe('ResponsavelService', () => {
  let service: ResponsavelService;
  let responsavelRepo: jest.Mocked<Repository<Responsavel>>;
  let usuarioRepoMock: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let responsavelRepoMock: { create: jest.Mock; save: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    usuarioRepoMock = {
      findOne: jest.fn(),
      create: jest.fn((dados: unknown) => dados),
      save: jest.fn(),
    };
    responsavelRepoMock = {
      create: jest.fn((dados: unknown) => dados),
      save: jest.fn(),
    };

    const managerMock = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Usuario ? usuarioRepoMock : responsavelRepoMock,
      ),
    };

    dataSource = {
      transaction: jest.fn((callback: (manager: unknown) => unknown) =>
        callback(managerMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsavelService,
        {
          provide: getRepositoryToken(Responsavel),
          useValue: { createQueryBuilder: jest.fn() },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(ResponsavelService);
    responsavelRepo = module.get(getRepositoryToken(Responsavel));

    jest.spyOn(UsuarioService, 'hashSenha').mockResolvedValue('hash-fake');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto: CreateResponsavelDto = {
      nomeCompleto: 'Carla Souza',
      email: 'carla@familia.com',
      senha: '123456',
    };

    it('cria usuario (escolaId null) e responsavel na mesma transacao', async () => {
      usuarioRepoMock.findOne.mockResolvedValue(null);
      usuarioRepoMock.save.mockResolvedValue({
        id: 10,
        email: dto.email,
        senha: 'hash-fake',
        perfil: 'responsavel',
        escolaId: null,
      });
      responsavelRepoMock.save.mockResolvedValue({
        id: 20,
        nomeCompleto: dto.nomeCompleto,
        telefone: null,
        usuarioId: 10,
      });

      const resultado = await service.create(dto);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(usuarioRepoMock.create).toHaveBeenCalledWith({
        email: dto.email,
        senha: 'hash-fake',
        perfil: 'responsavel',
        escolaId: null,
      });
      expect(resultado).toEqual({
        data: {
          id: 20,
          nomeCompleto: dto.nomeCompleto,
          telefone: null,
          email: dto.email,
        },
      });
      expect(resultado.data).not.toHaveProperty('senha');
    });

    it('rejeita email ja cadastrado sem gravar nada', async () => {
      usuarioRepoMock.findOne.mockResolvedValue({ id: 1, email: dto.email });

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      expect(usuarioRepoMock.save).not.toHaveBeenCalled();
      expect(responsavelRepoMock.save).not.toHaveBeenCalled();
    });
  });

  describe('findAllByEscola', () => {
    it('monta a query com joins ate aluno.escola_id e devolve os dados', async () => {
      const linhas = [
        {
          id: 1,
          nomeCompleto: 'Carla',
          telefone: null,
          email: 'carla@familia.com',
        },
      ];
      const qb = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(linhas),
      };
      responsavelRepo.createQueryBuilder.mockReturnValue(qb as never);

      const resultado = await service.findAllByEscola(1);

      expect(qb.where).toHaveBeenCalledWith('aluno.escola_id = :escolaId', {
        escolaId: 1,
      });
      expect(resultado).toEqual({ data: linhas });
    });
  });
});

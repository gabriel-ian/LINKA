import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProfessorService } from './professor.service';
import { Professor } from './professor.entity';
import { Usuario } from '../usuario/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { CreateProfessorDto } from './dto/create-professor.dto';

describe('ProfessorService', () => {
  let service: ProfessorService;
  let repository: jest.Mocked<Repository<Professor>>;
  let usuarioRepoMock: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let professorRepoMock: { create: jest.Mock; save: jest.Mock };
  let dataSource: { transaction: jest.Mock };

  beforeEach(async () => {
    usuarioRepoMock = {
      findOne: jest.fn(),
      create: jest.fn((dados: unknown) => dados),
      save: jest.fn(),
    };
    professorRepoMock = {
      create: jest.fn((dados: unknown) => dados),
      save: jest.fn(),
    };

    const managerMock = {
      getRepository: jest.fn((entity: unknown) =>
        entity === Usuario ? usuarioRepoMock : professorRepoMock,
      ),
    };

    dataSource = {
      transaction: jest.fn((callback: (manager: unknown) => unknown) =>
        callback(managerMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfessorService,
        {
          provide: getRepositoryToken(Professor),
          useValue: { find: jest.fn() },
        },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ProfessorService>(ProfessorService);
    repository = module.get(getRepositoryToken(Professor));

    jest.spyOn(UsuarioService, 'hashSenha').mockResolvedValue('hash-fake');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByEscola', () => {
    it('lista professores da escola sem devolver o hash da senha', async () => {
      repository.find.mockResolvedValue([
        {
          id: 1,
          nomeCompleto: 'Maria',
          escolaId: 1,
          usuario: { email: 'maria@escola.com' },
        },
      ] as Professor[]);

      const resultado = await service.findAllByEscola(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { escolaId: 1 },
        relations: { usuario: true },
        order: { nomeCompleto: 'ASC' },
      });
      expect(resultado).toEqual({
        data: [
          {
            id: 1,
            nomeCompleto: 'Maria',
            escolaId: 1,
            email: 'maria@escola.com',
          },
        ],
      });
    });

    it('devolve email nulo quando o professor nao tem usuario vinculado', async () => {
      repository.find.mockResolvedValue([
        { id: 2, nomeCompleto: 'Joao', escolaId: 1, usuario: null },
      ] as Professor[]);

      const resultado = await service.findAllByEscola(1);

      expect(resultado.data[0].email).toBeNull();
    });
  });

  describe('create', () => {
    const dto: CreateProfessorDto = {
      nomeCompleto: 'Maria Silva',
      email: 'maria@escola.com',
      senha: '123456',
    };

    it('cria usuario e professor na mesma transacao e nao devolve o hash', async () => {
      usuarioRepoMock.findOne.mockResolvedValue(null);
      usuarioRepoMock.save.mockResolvedValue({
        id: 10,
        email: dto.email,
        senha: 'hash-fake',
        perfil: 'professor',
        escolaId: 1,
      });
      professorRepoMock.save.mockResolvedValue({
        id: 20,
        nomeCompleto: dto.nomeCompleto,
        usuarioId: 10,
        escolaId: 1,
      });

      const resultado = await service.create(dto, 1);

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(usuarioRepoMock.findOne).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(UsuarioService.hashSenha).toHaveBeenCalledWith('123456');
      expect(usuarioRepoMock.create).toHaveBeenCalledWith({
        email: dto.email,
        senha: 'hash-fake',
        perfil: 'professor',
        escolaId: 1,
      });
      expect(professorRepoMock.create).toHaveBeenCalledWith({
        nomeCompleto: dto.nomeCompleto,
        usuarioId: 10,
        escolaId: 1,
      });
      expect(resultado).toEqual({
        data: {
          id: 20,
          nomeCompleto: dto.nomeCompleto,
          escolaId: 1,
          email: dto.email,
        },
      });
      expect(resultado.data).not.toHaveProperty('senha');
    });

    it('rejeita quando ja existe usuario com o mesmo email, sem gravar nada', async () => {
      usuarioRepoMock.findOne.mockResolvedValue({ id: 1, email: dto.email });

      await expect(service.create(dto, 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(usuarioRepoMock.save).not.toHaveBeenCalled();
      expect(professorRepoMock.save).not.toHaveBeenCalled();
    });
  });
});

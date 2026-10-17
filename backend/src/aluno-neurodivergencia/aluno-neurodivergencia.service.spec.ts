import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlunoNeurodivergenciaService } from './aluno-neurodivergencia.service';
import { AlunoNeurodivergencia } from './aluno-neurodivergencia.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Neurodivergencia } from '../neurodivergencia/neurodivergencia.entity';

describe('AlunoNeurodivergenciaService', () => {
  let service: AlunoNeurodivergenciaService;
  let vinculoRepo: jest.Mocked<Repository<AlunoNeurodivergencia>>;
  let alunoRepo: jest.Mocked<Repository<Aluno>>;
  let neurodivergenciaRepo: jest.Mocked<Repository<Neurodivergencia>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlunoNeurodivergenciaService,
        {
          provide: getRepositoryToken(AlunoNeurodivergencia),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Aluno),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Neurodivergencia),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(AlunoNeurodivergenciaService);
    vinculoRepo = module.get(getRepositoryToken(AlunoNeurodivergencia));
    alunoRepo = module.get(getRepositoryToken(Aluno));
    neurodivergenciaRepo = module.get(getRepositoryToken(Neurodivergencia));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { alunoId: 1, neurodivergenciaId: 2 };

    it('rejeita se o aluno nao e da escola logada', async () => {
      alunoRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita se a neurodivergencia nao existe', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      neurodivergenciaRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 1)).rejects.toThrow(BadRequestException);
    });

    it('rejeita vinculo duplicado', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      neurodivergenciaRepo.findOne.mockResolvedValue({
        id: 2,
      } as Neurodivergencia);
      vinculoRepo.findOne.mockResolvedValue({ id: 5 } as AlunoNeurodivergencia);

      await expect(service.create(dto, 1)).rejects.toThrow(
        'Vinculo ja existe para este aluno',
      );
    });

    it('cria o vinculo quando tudo e valido', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      neurodivergenciaRepo.findOne.mockResolvedValue({
        id: 2,
      } as Neurodivergencia);
      vinculoRepo.findOne.mockResolvedValue(null);
      const criado = {
        id: 5,
        alunoId: 1,
        neurodivergenciaId: 2,
      } as AlunoNeurodivergencia;
      vinculoRepo.create.mockReturnValue(criado);
      vinculoRepo.save.mockResolvedValue(criado);

      const resultado = await service.create(dto, 1);

      expect(resultado).toEqual({ data: criado });
    });
  });

  describe('findAllByAluno', () => {
    it('rejeita se o aluno nao e da escola logada', async () => {
      alunoRepo.findOne.mockResolvedValue(null);

      await expect(service.findAllByAluno(1, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lista as neurodivergencias do aluno', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      const vinculos = [{ id: 5 }] as AlunoNeurodivergencia[];
      vinculoRepo.find.mockResolvedValue(vinculos);

      const resultado = await service.findAllByAluno(1, 1);

      expect(vinculoRepo.find).toHaveBeenCalledWith({
        where: { alunoId: 1 },
        relations: { neurodivergencia: true },
      });
      expect(resultado).toEqual({ data: vinculos });
    });
  });
});

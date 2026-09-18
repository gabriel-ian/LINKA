import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlunoResponsavelService } from './aluno-responsavel.service';
import { AlunoResponsavel } from './aluno-responsavel.entity';
import { Aluno } from '../aluno/aluno.entity';
import { Responsavel } from '../responsavel/responsavel.entity';

describe('AlunoResponsavelService', () => {
  let service: AlunoResponsavelService;
  let vinculoRepo: jest.Mocked<Repository<AlunoResponsavel>>;
  let alunoRepo: jest.Mocked<Repository<Aluno>>;
  let responsavelRepo: jest.Mocked<Repository<Responsavel>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlunoResponsavelService,
        {
          provide: getRepositoryToken(AlunoResponsavel),
          useValue: { findOne: jest.fn(), create: jest.fn(), save: jest.fn(), find: jest.fn() },
        },
        { provide: getRepositoryToken(Aluno), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Responsavel), useValue: { findOne: jest.fn() } },
      ],
    }).compile();

    service = module.get(AlunoResponsavelService);
    vinculoRepo = module.get(getRepositoryToken(AlunoResponsavel));
    alunoRepo = module.get(getRepositoryToken(Aluno));
    responsavelRepo = module.get(getRepositoryToken(Responsavel));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { alunoId: 1, responsavelId: 2 };

    it('rejeita se o aluno nao e da escola logada', async () => {
      alunoRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 99)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita se o responsavel nao existe', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      responsavelRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejeita vinculo duplicado', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      responsavelRepo.findOne.mockResolvedValue({ id: 2 } as Responsavel);
      vinculoRepo.findOne.mockResolvedValue({
        alunoId: 1,
        responsavelId: 2,
      } as AlunoResponsavel);

      await expect(service.create(dto, 1)).rejects.toThrow('Vinculo ja existe');
    });

    it('cria o vinculo quando tudo e valido', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      responsavelRepo.findOne.mockResolvedValue({ id: 2 } as Responsavel);
      vinculoRepo.findOne.mockResolvedValue(null);
      const criado = { alunoId: 1, responsavelId: 2 } as AlunoResponsavel;
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

    it('lista os responsaveis do aluno', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1 } as Aluno);
      const vinculos = [{ alunoId: 1, responsavelId: 2 }] as AlunoResponsavel[];
      vinculoRepo.find.mockResolvedValue(vinculos);

      const resultado = await service.findAllByAluno(1, 1);

      expect(vinculoRepo.find).toHaveBeenCalledWith({
        where: { alunoId: 1 },
        relations: { responsavel: true },
      });
      expect(resultado).toEqual({ data: vinculos });
    });
  });
});

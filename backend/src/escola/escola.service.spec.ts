import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscolaService } from './escola.service';
import { Escola } from './escola.entity';

describe('EscolaService', () => {
  let service: EscolaService;
  let repository: jest.Mocked<Repository<Escola>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscolaService,
        {
          provide: getRepositoryToken(Escola),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EscolaService>(EscolaService);
    repository = module.get(getRepositoryToken(Escola));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('lista todas as escolas ordenadas por nome', async () => {
      const escolas = [{ id: 1, nome: 'Escola A' }] as Escola[];
      repository.find.mockResolvedValue(escolas);

      const resultado = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({ order: { nome: 'ASC' } });
      expect(resultado).toEqual({ data: escolas });
    });
  });

  describe('findOne', () => {
    it('devolve a escola quando encontrada', async () => {
      const escola = { id: 1, nome: 'Escola A' } as Escola;
      repository.findOne.mockResolvedValue(escola);

      const resultado = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(resultado).toEqual({ data: escola });
    });

    it('lanca NotFoundException quando a escola nao existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('cria a escola com cnpj nulo quando nao informado', async () => {
      const criada = { nome: 'Nova Escola', cnpj: null } as Escola;
      const salva = { ...criada, id: 2 } as Escola;
      repository.create.mockReturnValue(criada);
      repository.save.mockResolvedValue(salva);

      const resultado = await service.create({ nome: 'Nova Escola' });

      expect(repository.create).toHaveBeenCalledWith({
        nome: 'Nova Escola',
        cnpj: null,
      });
      expect(resultado).toEqual({ data: salva });
    });
  });

  describe('update', () => {
    it('verifica existencia, atualiza e devolve a escola atualizada', async () => {
      const escola = { id: 1, nome: 'Escola A' } as Escola;
      const atualizada = { id: 1, nome: 'Escola B' } as Escola;
      repository.findOne
        .mockResolvedValueOnce(escola)
        .mockResolvedValueOnce(atualizada);

      const resultado = await service.update(1, { nome: 'Escola B' });

      expect(repository.update).toHaveBeenCalledWith(1, { nome: 'Escola B' });
      expect(resultado).toEqual({ data: atualizada });
    });

    it('lanca NotFoundException se a escola nao existir', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, { nome: 'Escola B' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('desativa a escola (soft delete)', async () => {
      repository.findOne.mockResolvedValue({ id: 1 } as Escola);

      const resultado = await service.remove(1);

      expect(repository.update).toHaveBeenCalledWith(1, { ativo: false });
      expect(resultado).toEqual({ data: true });
    });
  });

  describe('activate', () => {
    it('reativa a escola', async () => {
      repository.findOne.mockResolvedValue({ id: 1 } as Escola);

      const resultado = await service.activate(1);

      expect(repository.update).toHaveBeenCalledWith(1, { ativo: true });
      expect(resultado).toEqual({ data: true });
    });
  });
});

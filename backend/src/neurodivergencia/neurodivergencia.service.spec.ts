import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NeurodivergenciaService } from './neurodivergencia.service';
import { Neurodivergencia } from './neurodivergencia.entity';

describe('NeurodivergenciaService', () => {
  let service: NeurodivergenciaService;
  let repository: jest.Mocked<Repository<Neurodivergencia>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NeurodivergenciaService,
        {
          provide: getRepositoryToken(Neurodivergencia),
          useValue: { find: jest.fn(), create: jest.fn(), save: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<NeurodivergenciaService>(NeurodivergenciaService);
    repository = module.get(getRepositoryToken(Neurodivergencia));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('lista neurodivergencias ordenadas por nome', async () => {
      const itens = [{ id: 1, nome: 'TDAH' }] as Neurodivergencia[];
      repository.find.mockResolvedValue(itens);

      const resultado = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({ order: { nome: 'ASC' } });
      expect(resultado).toEqual({ data: itens });
    });
  });

  describe('create', () => {
    it('cria a neurodivergencia', async () => {
      const criada = { nome: 'TEA' } as Neurodivergencia;
      const salva = { ...criada, id: 1 } as Neurodivergencia;
      repository.create.mockReturnValue(criada);
      repository.save.mockResolvedValue(salva);

      const resultado = await service.create({ nome: 'TEA' });

      expect(repository.create).toHaveBeenCalledWith({ nome: 'TEA' });
      expect(resultado).toEqual({ data: salva });
    });
  });
});

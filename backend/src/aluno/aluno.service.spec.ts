import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlunoService } from './aluno.service';
import { Aluno } from './aluno.entity';
import { CreateAlunoDto } from './dto/create-aluno.dto';

describe('AlunoService', () => {
  let service: AlunoService;
  let repository: jest.Mocked<Repository<Aluno>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlunoService,
        {
          provide: getRepositoryToken(Aluno),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlunoService>(AlunoService);
    repository = module.get(getRepositoryToken(Aluno));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByEscola', () => {
    it('busca apenas alunos da escola informada, ordenados por nome', async () => {
      const alunos = [{ id: 1, nomeCompleto: 'Ana' }] as Aluno[];
      repository.find.mockResolvedValue(alunos);

      const resultado = await service.findAllByEscola(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { escolaId: 1 },
        order: { nomeCompleto: 'ASC' },
      });
      expect(resultado).toEqual({ data: alunos });
    });
  });

  describe('create', () => {
    it('preenche campos opcionais ausentes com o default e vincula a escola', async () => {
      const dto: CreateAlunoDto = { nomeCompleto: 'Lucas' };
      const criado = { ...dto, escolaId: 1 } as unknown as Aluno;
      const salvo = { ...criado, id: 5 };

      repository.create.mockReturnValue(criado);
      repository.save.mockResolvedValue(salvo);

      const resultado = await service.create(dto, 1);

      expect(repository.create).toHaveBeenCalledWith({
        nomeCompleto: 'Lucas',
        data_nascimento: null,
        cgm: null,
        neurodivergente: false,
        laudo: null,
        escolaId: 1,
      });
      expect(repository.save).toHaveBeenCalledWith(criado);
      expect(resultado).toEqual({ data: salvo });
    });

    it('preserva os campos opcionais quando informados', async () => {
      const dto: CreateAlunoDto = {
        nomeCompleto: 'Lucas',
        data_nascimento: '2011-04-23',
        cgm: '2024001234',
        neurodivergente: true,
        laudo: 'laudos/lucas.pdf',
      };
      repository.create.mockReturnValue(dto as unknown as Aluno);
      repository.save.mockResolvedValue(dto as unknown as Aluno);

      await service.create(dto, 7);

      expect(repository.create).toHaveBeenCalledWith({
        nomeCompleto: 'Lucas',
        data_nascimento: '2011-04-23',
        cgm: '2024001234',
        neurodivergente: true,
        laudo: 'laudos/lucas.pdf',
        escolaId: 7,
      });
    });
  });
});

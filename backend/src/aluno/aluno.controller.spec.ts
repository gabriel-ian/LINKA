import { Test, TestingModule } from '@nestjs/testing';
import { AlunoController } from './aluno.controller';
import { AlunoService } from './aluno.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';

describe('AlunoController', () => {
  let controller: AlunoController;
  let service: jest.Mocked<AlunoService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlunoController],
      providers: [
        {
          provide: AlunoService,
          useValue: {
            findAllByEscola: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AlunoController>(AlunoController);
    service = module.get(AlunoService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('delega para o service usando o escolaId do token', async () => {
      const resposta = { data: [] };
      service.findAllByEscola.mockResolvedValue(resposta);

      const resultado = await controller.findAll(1);

      expect(service.findAllByEscola).toHaveBeenCalledWith(1);
      expect(resultado).toBe(resposta);
    });
  });

  describe('create', () => {
    it('encaminha o corpo da requisicao e o escolaId do token', async () => {
      const dto: CreateAlunoDto = { nomeCompleto: 'Lucas' };
      const resposta = { data: { id: 1, ...dto } };
      service.create.mockResolvedValue(resposta as never);

      const resultado = await controller.create(dto, 3);

      expect(service.create).toHaveBeenCalledWith(dto, 3);
      expect(resultado).toBe(resposta);
    });
  });
});

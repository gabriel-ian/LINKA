import { Test, TestingModule } from '@nestjs/testing';
import { MatriculaController } from './matricula.controller';
import { MatriculaService } from './matricula.service';

describe('MatriculaController', () => {
  let controller: MatriculaController;
  let service: jest.Mocked<MatriculaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MatriculaController],
      providers: [
        {
          provide: MatriculaService,
          useValue: {
            findAllByEscola: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MatriculaController>(MatriculaController);
    service = module.get(MatriculaService);
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
      const dto = { alunoId: 1, turmaId: 2 };
      const resposta = { data: { alunoId: 1, turmaId: 2 } };
      service.create.mockResolvedValue(resposta as never);

      const resultado = await controller.create(dto, 1);

      expect(service.create).toHaveBeenCalledWith(dto, 1);
      expect(resultado).toBe(resposta);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TurmaController } from './turma.controller';
import { TurmaService } from './turma.service';

describe('TurmaController', () => {
  let controller: TurmaController;
  let service: jest.Mocked<TurmaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TurmaController],
      providers: [
        {
          provide: TurmaService,
          useValue: {
            findAllByEscola: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TurmaController>(TurmaController);
    service = module.get(TurmaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('delega para o service usando o escolaId do token', async () => {
      const resposta = { data: [] };
      service.findAllByEscola.mockResolvedValue(resposta as never);

      const resultado = await controller.findAll(2);

      expect(service.findAllByEscola).toHaveBeenCalledWith(2);
      expect(resultado).toBe(resposta);
    });
  });

  describe('create', () => {
    it('encaminha o corpo da requisicao e o escolaId do token', async () => {
      const dto = { nome: 'Turma A' };
      const resposta = { data: { id: 1, ...dto } };
      service.create.mockResolvedValue(resposta as never);

      const resultado = await controller.create(dto, 4);

      expect(service.create).toHaveBeenCalledWith(dto, 4);
      expect(resultado).toBe(resposta);
    });
  });
});

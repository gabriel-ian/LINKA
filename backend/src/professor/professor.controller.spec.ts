import { Test, TestingModule } from '@nestjs/testing';
import { ProfessorController } from './professor.controller';
import { ProfessorService } from './professor.service';

describe('ProfessorController', () => {
  let controller: ProfessorController;
  let service: jest.Mocked<ProfessorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfessorController],
      providers: [
        {
          provide: ProfessorService,
          useValue: {
            findAllByEscola: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProfessorController>(ProfessorController);
    service = module.get(ProfessorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('usa o escolaId do token, nao um id de usuario', async () => {
      const resposta = { data: [] };
      service.findAllByEscola.mockResolvedValue(resposta as never);

      const resultado = await controller.findAll(5);

      expect(service.findAllByEscola).toHaveBeenCalledWith(5);
      expect(resultado).toBe(resposta);
    });
  });

  describe('create', () => {
    it('encaminha o corpo da requisicao e o escolaId do token', async () => {
      const dto = {
        nomeCompleto: 'Maria',
        email: 'maria@escola.com',
        senha: '123456',
      };
      const resposta = { data: { id: 1, ...dto } };
      service.create.mockResolvedValue(resposta as never);

      const resultado = await controller.create(dto, 6);

      expect(service.create).toHaveBeenCalledWith(dto, 6);
      expect(resultado).toBe(resposta);
    });
  });
});

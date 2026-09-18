import { Test, TestingModule } from '@nestjs/testing';
import { EscolaController } from './escola.controller';
import { EscolaService } from './escola.service';

describe('EscolaController', () => {
  let controller: EscolaController;
  let service: jest.Mocked<EscolaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EscolaController],
      providers: [
        {
          provide: EscolaService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<EscolaController>(EscolaController);
    service = module.get(EscolaService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMinhaEscola', () => {
    it('busca a escola usando o escolaId do usuario logado, nao um id da rota', async () => {
      const resposta = { data: { id: 1, nome: 'Escola A' } };
      service.findOne.mockResolvedValue(resposta as never);

      const resultado = await controller.getMinhaEscola(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(resultado).toBe(resposta);
    });
  });
});

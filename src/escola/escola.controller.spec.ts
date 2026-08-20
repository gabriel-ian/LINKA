import { Test, TestingModule } from '@nestjs/testing';
import { EscolaController } from './escola.controller';

describe('EscolaController', () => {
  let controller: EscolaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EscolaController],
    }).compile();

    controller = module.get<EscolaController>(EscolaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { EscolaService } from './escola.service';

describe('EscolaService', () => {
  let service: EscolaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EscolaService],
    }).compile();

    service = module.get<EscolaService>(EscolaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

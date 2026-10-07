import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { promises as fs } from 'fs';
import { CadastrosEscolaService, gerarSenhaProvisoria } from './cadastros-escola.service';
import { TarefaStatusService } from '../tarefa-status/tarefa-status.service';

function arquivo(bytes: number[], size = bytes.length) {
  return { buffer: Buffer.from(bytes), size } as Express.Multer.File;
}

describe('CadastrosEscolaService', () => {
  let service: CadastrosEscolaService;
  let alunoRepo: { findOne: jest.Mock; update: jest.Mock };

  beforeEach(() => {
    alunoRepo = { findOne: jest.fn(), update: jest.fn() };
    const dataSource = { getRepository: jest.fn(() => alunoRepo) } as unknown as DataSource;
    service = new CadastrosEscolaService(dataSource, {} as TarefaStatusService);
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    jest.spyOn(fs, 'rm').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('gera senha provisoria sem caracteres ambiguos', () => {
    const senhas = Array.from({ length: 50 }, () => gerarSenhaProvisoria());
    for (const senha of senhas) {
      expect(senha).toHaveLength(10);
      expect(senha).not.toMatch(/[0O1lI]/);
    }
    expect(new Set(senhas).size).toBe(50);
  });

  describe('salvarLaudo', () => {
    const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];

    it('recusa arquivo que nao e PDF/PNG/JPG pelos bytes, mesmo com nome .pdf', async () => {
      await expect(service.salvarLaudo(1, 5, arquivo([0x4d, 0x5a, 0x00]))).rejects.toThrow(
        BadRequestException,
      );
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('recusa laudo acima de 10 MB', async () => {
      await expect(service.salvarLaudo(1, 5, arquivo(PDF, 11 * 1024 * 1024))).rejects.toThrow(
        'O laudo pode ter ate 10 MB',
      );
    });

    it('so aceita aluno da propria escola', async () => {
      alunoRepo.findOne.mockResolvedValue(null);

      await expect(service.salvarLaudo(1, 5, arquivo(PDF))).rejects.toThrow(NotFoundException);
      expect(alunoRepo.findOne).toHaveBeenCalledWith({ where: { id: 1, escolaId: 5 } });
    });

    it('grava o PDF e apaga o laudo anterior', async () => {
      alunoRepo.findOne.mockResolvedValue({ id: 1, laudo: '1-antigo.pdf' });

      await service.salvarLaudo(1, 5, arquivo(PDF));

      expect(fs.writeFile).toHaveBeenCalledWith(expect.stringMatching(/1-\d+\.pdf$/), expect.any(Buffer));
      expect(fs.rm).toHaveBeenCalledWith(expect.stringMatching(/1-antigo\.pdf$/), { force: true });
      expect(alunoRepo.update).toHaveBeenCalledWith(1, {
        laudo: expect.stringMatching(/^1-\d+\.pdf$/),
        laudoEnviadoEm: expect.any(Date),
      });
    });
  });
});

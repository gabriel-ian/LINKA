import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { gravarDesenho } from './desenho';

const png = (tamanho?: number) => {
  const buffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0,
  ]);
  return { buffer, size: tamanho ?? buffer.length } as Express.Multer.File;
};

describe('gravarDesenho', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue();
  });
  afterEach(() => jest.restoreAllMocks());

  it('grava um PNG com o id do aluno no nome', async () => {
    await gravarDesenho(12, png());
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringMatching(/desenhos[\\/]12\.png$/),
      expect.any(Buffer),
    );
  });

  it('recusa o que nao e PNG', async () => {
    const jpg = {
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
      size: 4,
    } as Express.Multer.File;
    await expect(gravarDesenho(12, jpg)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('recusa desenho grande demais', async () => {
    await expect(gravarDesenho(12, png(3 * 1024 * 1024))).rejects.toThrow(
      'grande demais',
    );
  });
});

import { BadRequestException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { DataSource } from 'typeorm';
import { TarefaAnexoService } from './tarefa-anexo.service';

/** Arquivo como o multer entrega (em memoria). */
function arquivo(nome: string, bytes: number[] | Buffer, tamanho?: number) {
  const buffer = Buffer.isBuffer(bytes)
    ? bytes
    : Buffer.from([...bytes, 0, 0, 0, 0]);
  return {
    originalname: Buffer.from(nome, 'utf8').toString('latin1'),
    buffer,
    size: tamanho ?? buffer.length,
  } as Express.Multer.File;
}

const PDF = [0x25, 0x50, 0x44, 0x46, 0x2d];
const EXE = [0x4d, 0x5a, 0x90, 0x00];

describe('TarefaAnexoService', () => {
  let query: jest.Mock;
  let service: TarefaAnexoService;

  beforeEach(() => {
    query = jest.fn().mockImplementation((sql: string) => {
      if (sql.startsWith('SELECT COUNT(*)'))
        return Promise.resolve([{ total: 0 }]);
      return Promise.resolve([]);
    });
    service = new TarefaAnexoService({ query } as unknown as DataSource);
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue();
  });
  afterEach(() => jest.restoreAllMocks());

  it('aceita PDF e guarda o nome original com acento', async () => {
    await service.anexar(7, [arquivo('Exercícios de frações.pdf', PDF)]);
    const insert = query.mock.calls.find(([sql]) =>
      String(sql).startsWith('INSERT'),
    );
    expect(insert?.[1]).toEqual([
      7,
      'Exercícios de frações.pdf',
      expect.stringMatching(/^7-.+\.pdf$/),
      'pdf',
      9,
    ]);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('recusa arquivo de outro tipo com nome de PDF (confere os bytes)', async () => {
    await expect(
      service.anexar(7, [arquivo('virus.pdf', EXE)]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('aceita DOCX (zip com a pasta word/) e recusa outro zip', async () => {
    const docx = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.from('word/document.xml'),
    ]);
    const zip = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.from('fotos/a.png'),
    ]);
    await expect(
      service.anexar(7, [arquivo('trabalho.docx', docx)]),
    ).resolves.toBeDefined();
    await expect(
      service.anexar(7, [arquivo('pasta.docx', zip)]),
    ).rejects.toThrow('Word');
  });

  it('recusa arquivo maior que 10 MB', async () => {
    await expect(
      service.anexar(7, [arquivo('grande.pdf', PDF, 11 * 1024 * 1024)]),
    ).rejects.toThrow('10 MB');
  });

  it('nao passa de 5 arquivos por tarefa e nao grava nada se um falhar', async () => {
    query.mockImplementation((sql: string) =>
      Promise.resolve(sql.startsWith('SELECT COUNT(*)') ? [{ total: 4 }] : []),
    );
    await expect(
      service.anexar(7, [arquivo('a.pdf', PDF), arquivo('b.pdf', PDF)]),
    ).rejects.toThrow('até 5');

    query.mockImplementation((sql: string) =>
      Promise.resolve(sql.startsWith('SELECT COUNT(*)') ? [{ total: 0 }] : []),
    );
    await expect(
      service.anexar(7, [arquivo('ok.pdf', PDF), arquivo('ruim.pdf', EXE)]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});

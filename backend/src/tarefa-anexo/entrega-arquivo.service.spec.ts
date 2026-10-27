import { BadRequestException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { DataSource } from 'typeorm';
import { EntregaArquivoService } from './entrega-arquivo.service';

/** Arquivo como o multer entrega (em memoria). */
function arquivo(nome: string, bytes: number[], tamanho?: number) {
  const buffer = Buffer.from([...bytes, 0, 0, 0, 0]);
  return {
    originalname: Buffer.from(nome, 'utf8').toString('latin1'),
    buffer,
    size: tamanho ?? buffer.length,
  } as Express.Multer.File;
}

const JPG = [0xff, 0xd8, 0xff, 0xe0];
const EXE = [0x4d, 0x5a, 0x90, 0x00];

describe('EntregaArquivoService', () => {
  let query: jest.Mock;
  let service: EntregaArquivoService;
  let jaEnviados: unknown[];

  beforeEach(() => {
    jaEnviados = [];
    query = jest.fn().mockImplementation((sql: string) => {
      if (sql.trim().startsWith('SELECT id, nome'))
        return Promise.resolve(jaEnviados);
      return Promise.resolve([]);
    });
    service = new EntregaArquivoService({ query } as unknown as DataSource);
    jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    jest.spyOn(fs, 'writeFile').mockResolvedValue();
  });
  afterEach(() => jest.restoreAllMocks());

  it('guarda a foto do aluno com o nome original', async () => {
    await service.enviar(7, 3, [arquivo('foto do caderno.jpg', JPG)]);
    const insert = query.mock.calls.find(([sql]) =>
      String(sql).startsWith('INSERT'),
    );
    expect(insert?.[1]).toEqual([
      7,
      3,
      'foto do caderno.jpg',
      expect.stringMatching(/^7-3-.+\.jpg$/),
      'jpg',
      8,
    ]);
  });

  it('recusa arquivo que nao e foto, PDF ou Word', async () => {
    await expect(
      service.enviar(7, 3, [arquivo('jogo.jpg', EXE)]),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('nao passa de 3 arquivos por tarefa', async () => {
    jaEnviados = [{ id: 1 }, { id: 2 }];
    await expect(
      service.enviar(7, 3, [arquivo('a.jpg', JPG), arquivo('b.jpg', JPG)]),
    ).rejects.toThrow('até 3');
  });

  it('pede um arquivo quando nao vem nenhum', async () => {
    await expect(service.enviar(7, 3, [])).rejects.toThrow('Escolha');
  });

  it('so remove arquivo do proprio aluno', async () => {
    await expect(service.remover(7, 3, 99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    const select = query.mock.calls[0];
    expect(select[1]).toEqual([99, 7, 3]);
  });
});

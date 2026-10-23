import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { EmailService } from '../email/email.service';
import { LgpdService, TERMO_VERSAO } from './lgpd.service';

describe('LgpdService', () => {
  let query: jest.Mock;
  let consultasNaTransacao: string[];
  let service: LgpdService;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([]);
    consultasNaTransacao = [];
    const dataSource = {
      query,
      transaction: (fn: (m: { query: jest.Mock }) => Promise<unknown>) =>
        fn({
          query: jest.fn((sql: string) => {
            consultasNaTransacao.push(sql);
            return Promise.resolve([]);
          }),
        }),
    } as unknown as DataSource;
    service = new LgpdService(dataSource, {
      enviar: jest.fn(),
      url: (c: string) => c,
    } as unknown as EmailService);
  });

  it('recusa aceite de uma versao antiga do termo', async () => {
    await expect(
      service.aceitarTermo(1, '2020-01', null),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('aceite da versao atual grava o consentimento uma vez', async () => {
    query
      .mockResolvedValueOnce([{ id: 5 }]) // responsavel do usuario
      .mockResolvedValueOnce([]); // ainda nao aceitou
    await service.aceitarTermo(9, TERMO_VERSAO, '10.0.0.1');
    expect(query).toHaveBeenLastCalledWith(
      'INSERT INTO consentimento (responsavel_id, versao, ip) VALUES (?, ?, ?)',
      [5, TERMO_VERSAO, '10.0.0.1'],
    );
  });

  it('familia so pede exclusao de filho dela', async () => {
    query
      .mockResolvedValueOnce([{ id: 5 }]) // responsavel
      .mockResolvedValueOnce([]); // sem vinculo com o aluno
    await expect(service.pedirExclusao(9, 77)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('nao abre um segundo pedido de exclusao para o mesmo aluno', async () => {
    query
      .mockResolvedValueOnce([{ id: 5 }])
      .mockResolvedValueOnce([{ 1: 1 }]) // e filho
      .mockResolvedValueOnce([{ 1: 1 }]); // ja tem pedido aberto
    await service.pedirExclusao(9, 77);
    expect(query).toHaveBeenCalledTimes(3);
  });

  it('exclusao pede o nome completo do aluno para confirmar', async () => {
    query.mockResolvedValueOnce([
      { nome: 'Ana Souza', usuarioId: null, laudo: null, anonimizadoEm: null },
    ]);
    await expect(service.anonimizar(77, 1, 'Ana')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(consultasNaTransacao).toEqual([]);
  });

  it('exclusao apaga diagnosticos, vinculos e login e deixa o aluno anonimo', async () => {
    query.mockResolvedValueOnce([
      { nome: 'Ana Souza', usuarioId: 40, laudo: null, anonimizadoEm: null },
    ]);
    await service.anonimizar(77, 1, ' ana souza ');
    const sql = consultasNaTransacao.join('\n');
    expect(sql).toContain('DELETE FROM aluno_neurodivergencia');
    expect(sql).toContain('DELETE FROM aluno_responsavel');
    expect(sql).toContain('DELETE FROM usuario');
    expect(sql).toContain('anonimizado_em = NOW()');
    expect(sql).not.toContain('DELETE FROM tarefa_status');
  });

  it('nao apaga duas vezes', async () => {
    query.mockResolvedValueOnce([
      {
        nome: 'Aluno removido #77',
        usuarioId: null,
        laudo: null,
        anonimizadoEm: new Date(),
      },
    ]);
    await expect(
      service.anonimizar(77, 1, 'Aluno removido #77'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

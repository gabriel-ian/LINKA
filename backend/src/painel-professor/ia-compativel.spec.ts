import { ServiceUnavailableException } from '@nestjs/common';
import { z } from 'zod';
import { chamarIaCompativel, lerJson } from './ia-compativel';

const cfg = {
  url: 'https://ia.exemplo/v1/',
  modelo: 'modelo-teste',
  chave: 'k',
};
const Schema = z.object({ texto: z.string() });

/** Resposta no formato de chat da OpenAI. */
function resposta(conteudo: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () =>
      Promise.resolve({ choices: [{ message: { content: conteudo } }] }),
  } as unknown as Response;
}

describe('chamarIaCompativel', () => {
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());

  it('envia no formato da OpenAI e devolve o JSON validado', async () => {
    fetchMock.mockResolvedValueOnce(resposta('{"texto":"Oi"}'));

    await expect(
      chamarIaCompativel(cfg, 'Instrucoes', 'conteudo', Schema),
    ).resolves.toEqual({
      texto: 'Oi',
    });

    const [url, opcoes] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://ia.exemplo/v1/chat/completions');
    expect((opcoes.headers as Record<string, string>).Authorization).toBe(
      'Bearer k',
    );
    const corpo = JSON.parse(opcoes.body as string);
    expect(corpo.model).toBe('modelo-teste');
    expect(corpo.response_format).toEqual({ type: 'json_object' });
    expect(corpo.messages[0].content).toContain('JSON Schema');
  });

  it('formato errado: pede de novo explicando o erro', async () => {
    fetchMock
      .mockResolvedValueOnce(resposta('{"outro":1}'))
      .mockResolvedValueOnce(resposta('{"texto":"Agora sim"}'));

    await expect(chamarIaCompativel(cfg, 's', 'c', Schema)).resolves.toEqual({
      texto: 'Agora sim',
    });
    const segunda = JSON.parse(
      (fetchMock.mock.calls[1][1] as RequestInit).body as string,
    );
    expect(segunda.messages.at(-1).content).toContain('nao seguiu o formato');
  });

  it('desiste depois das tentativas com formato errado', async () => {
    fetchMock.mockResolvedValue(resposta('nada de json'));
    await expect(chamarIaCompativel(cfg, 's', 'c', Schema)).rejects.toThrow(
      'A IA nao conseguiu gerar a adaptacao agora',
    );
  });

  it('chave invalida e servico ocupado viram mensagens claras', async () => {
    fetchMock.mockResolvedValueOnce(resposta('', 401));
    await expect(chamarIaCompativel(cfg, 's', 'c', Schema)).rejects.toThrow(
      'Chave da IA invalida',
    );

    fetchMock.mockResolvedValueOnce(resposta('', 429));
    await expect(chamarIaCompativel(cfg, 's', 'c', Schema)).rejects.toThrow(
      'IA ocupada',
    );
  });

  it('sem rede: avisa que nao falou com a IA', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(
      chamarIaCompativel(cfg, 's', 'c', Schema),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('servico local (Ollama) sem chave nao manda Authorization', async () => {
    fetchMock.mockResolvedValueOnce(resposta('{"texto":"x"}'));
    await chamarIaCompativel(
      { url: 'http://localhost:11434/v1', modelo: 'llama3.1' },
      's',
      'c',
      Schema,
    );
    const opcoes = fetchMock.mock.calls[0][1] as RequestInit;
    expect(
      (opcoes.headers as Record<string, string>).Authorization,
    ).toBeUndefined();
  });
});

describe('lerJson', () => {
  it('aceita JSON dentro de bloco de codigo ou com texto em volta', () => {
    expect(lerJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(lerJson('Aqui esta: {"a":2} pronto')).toEqual({ a: 2 });
    expect(lerJson('sem json')).toBeNull();
  });
});

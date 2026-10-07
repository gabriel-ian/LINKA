import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdaptacaoIaService, PerfilParaIa } from './adaptacao-ia.service';
import { semanasDoMes } from './painel-professor.service';

const perfil = (alunoId: number): PerfilParaIa => ({
  alunoId,
  primeiroNome: 'Lucas',
  idade: 14,
  diagnosticos: ['TDAH'],
  interesses: ['Dinossauros'],
  dificuldades: null,
});

function servico(chave: string | undefined, parse?: jest.Mock) {
  const s = new AdaptacaoIaService({ get: () => chave } as unknown as ConfigService);
  if (parse) (s as any).cliente = { beta: { messages: { parse } } };
  return s;
}

describe('AdaptacaoIaService', () => {
  it('fica indisponivel sem ANTHROPIC_API_KEY e recusa chamar', async () => {
    const s = servico(undefined);
    expect(s.disponivel).toBe(false);
    await expect(
      s.adaptarTarefa({ titulo: 't', disciplina: null, enunciado: 'e' }, [perfil(1)]),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('nao chama a API quando nao ha alunos NEE', async () => {
    const parse = jest.fn();
    const s = servico('chave', parse);
    expect(await s.adaptarTarefa({ titulo: 't', disciplina: null, enunciado: 'e' }, [])).toEqual([]);
    expect(parse).not.toHaveBeenCalled();
  });

  it('envia so dados minimos do aluno e descarta ids que nao foram pedidos', async () => {
    const parse = jest.fn().mockResolvedValue({
      stop_reason: 'end_turn',
      parsed_output: {
        adaptacoes: [
          { alunoId: 1, passos: ['Separe o caderno.'], recursos: ['1 passo curto'] },
          { alunoId: 99, passos: ['Inventado.'], recursos: [] },
          { alunoId: 2, passos: [], recursos: [] },
        ],
      },
    });
    const s = servico('chave', parse);

    const r = await s.adaptarTarefa({ titulo: 'Exercicios', disciplina: 'Matemática', enunciado: 'Resolva 5 a 10' }, [
      perfil(1),
      perfil(2),
    ]);

    expect(r).toEqual([{ alunoId: 1, passos: ['Separe o caderno.'], recursos: ['1 passo curto'] }]);
    const pedido = parse.mock.calls[0][0];
    expect(pedido.model).toBe('claude-opus-5-5');
    expect(pedido.fallbacks).toBe('default');
    expect(pedido.messages[0].content).not.toMatch(/cgm|laudo|email/i);
  });

  it('trata recusa como indisponibilidade, sem quebrar a tarefa', async () => {
    const parse = jest.fn().mockResolvedValue({ stop_reason: 'refusal', parsed_output: null });
    const s = servico('chave', parse);
    await expect(s.simplificarComunicado('Prova', 'Estudar cap. 4')).rejects.toThrow(ServiceUnavailableException);
  });
});

describe('semanasDoMes', () => {
  it('divide o mes em 1-7, 8-14, 15-21 e 22-fim', () => {
    expect(semanasDoMes('2026-02')).toEqual([
      ['2026-02-01', '2026-02-07'],
      ['2026-02-08', '2026-02-14'],
      ['2026-02-15', '2026-02-21'],
      ['2026-02-22', '2026-02-28'],
    ]);
  });
});

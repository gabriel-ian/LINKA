import {
  TarefaJogo,
  conquistaQuaseLa,
  conquistas,
  nivel,
  pontos,
  pontosDaTarefa,
  sequenciaAtual,
} from './gamificacao';

const dia = (d: number, h = 15, m = 0) => new Date(2026, 6, d, h, m);

function tarefa(parcial: Partial<TarefaJogo>): TarefaJogo {
  return {
    disciplina: 'Matemática',
    concluida: false,
    concluidoEm: null,
    iniciadoEm: null,
    iniciouSozinho: null,
    totalPassos: 1,
    ...parcial,
  };
}

describe('gamificacao', () => {
  it('da 10 pontos por tarefa e mais 10 se comecou sozinho', () => {
    expect(pontosDaTarefa(tarefa({}))).toBe(0);
    expect(pontosDaTarefa(tarefa({ concluida: true }))).toBe(10);
    expect(
      pontosDaTarefa(tarefa({ concluida: true, iniciouSozinho: true })),
    ).toBe(20);
  });

  it('separa os pontos de hoje', () => {
    const hoje = dia(7, 20);
    expect(
      pontos(
        [
          tarefa({
            concluida: true,
            concluidoEm: dia(6),
            iniciouSozinho: true,
          }),
          tarefa({ concluida: true, concluidoEm: dia(7) }),
        ],
        hoje,
      ),
    ).toEqual({ total: 30, hoje: 10 });
  });

  it('calcula o nivel pelos pontos (340 = Explorador, proximo em 500)', () => {
    expect(nivel(0)).toEqual({ numero: 1, nome: 'Iniciante', proximo: 50 });
    expect(nivel(340)).toEqual({ numero: 4, nome: 'Explorador', proximo: 500 });
    expect(nivel(5000).proximo).toBeNull();
  });

  it('sequencia atual so quebra se o dia de hoje e o de ontem passarem em branco', () => {
    const datas = [dia(3), dia(4), dia(5), dia(6)];
    expect(sequenciaAtual(datas, dia(6, 20))).toBe(4);
    expect(sequenciaAtual(datas, dia(7, 9))).toBe(4); // hoje ainda pode fazer
    expect(sequenciaAtual(datas, dia(8, 9))).toBe(0);
    expect(sequenciaAtual([...datas, dia(6, 18)], dia(6, 20))).toBe(4);
  });

  it('desbloqueia conquistas pelo historico e limita o progresso a meta', () => {
    const feitas = [3, 4, 5, 6, 7].map((d) =>
      tarefa({
        concluida: true,
        iniciouSozinho: true,
        iniciadoEm: dia(d, 14),
        concluidoEm: dia(d, 14, 30),
        totalPassos: 4,
      }),
    );
    const lista = conquistas(feitas);
    const por = Object.fromEntries(lista.map((c) => [c.chave, c]));

    expect(por['primeiro-passo'].desbloqueada).toBe(true);
    expect(por['sequencia-5'].desbloqueada).toBe(true);
    expect(por['autonomia'].atual).toBe(3);
    expect(por['foco'].desbloqueada).toBe(true);
    expect(por['matematico'].desbloqueada).toBe(true);
    expect(por['sequencia-10']).toMatchObject({
      atual: 5,
      desbloqueada: false,
    });
    expect(por['leitura'].atual).toBe(0);
  });

  it('aponta a conquista bloqueada mais proxima', () => {
    const lista = conquistas(
      [3, 5, 7, 9].map((d) =>
        tarefa({
          concluida: true,
          concluidoEm: dia(d),
          disciplina: 'Matemática',
        }),
      ),
    );
    expect(conquistaQuaseLa(lista)?.chave).toBe('matematico');
  });
});

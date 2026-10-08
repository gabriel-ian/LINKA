import {
  LinhaTarefa,
  codigoTurma,
  idade,
  maiorSequencia,
  mesDe,
  mesesAte,
  semanaDe,
  situacao,
  taxaConclusao,
  taxaNoPrazo,
} from './metricas';

function linha(parcial: Partial<LinhaTarefa>): LinhaTarefa {
  return {
    alunoId: 1,
    tarefaId: 1,
    turmaId: 1,
    dataEntrega: '2026-07-10',
    horaLimite: null,
    concluida: false,
    concluidoEm: null,
    ...parcial,
  };
}

describe('metricas do painel da escola', () => {
  it('semanaDe vai de segunda a domingo', () => {
    // 2026-07-15 e uma quarta-feira
    expect(semanaDe(new Date(2026, 6, 15))).toEqual([
      '2026-07-13',
      '2026-07-19',
    ]);
    // domingo pertence a semana que comecou na segunda anterior
    expect(semanaDe(new Date(2026, 6, 19))).toEqual([
      '2026-07-13',
      '2026-07-19',
    ]);
  });

  it('mesDe e mesesAte respeitam a virada de ano', () => {
    expect(mesDe('2026-02')).toEqual(['2026-02-01', '2026-02-28']);
    expect(mesesAte('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02']);
  });

  it('taxaConclusao arredonda e devolve null sem tarefas', () => {
    expect(taxaConclusao([])).toBeNull();
    expect(
      taxaConclusao([linha({ concluida: true }), linha({}), linha({})]),
    ).toBe(33);
  });

  it('taxaNoPrazo so conta tarefas vencidas e entregas ate o prazo', () => {
    const hoje = new Date(2026, 6, 20, 12);
    const linhas = [
      linha({ concluida: true, concluidoEm: new Date(2026, 6, 10, 20) }), // no prazo
      linha({ concluida: true, concluidoEm: new Date(2026, 6, 11, 9) }), // atrasada
      linha({ concluida: false }), // vencida e nao feita
      linha({ dataEntrega: '2026-07-30' }), // ainda nao venceu: fora da conta
    ];
    expect(taxaNoPrazo(linhas, hoje)).toBe(33);
    expect(
      taxaNoPrazo([linha({ dataEntrega: '2026-07-30' })], hoje),
    ).toBeNull();
  });

  it('situacao segue as faixas do Figma', () => {
    expect(situacao(null)).toBe('sem-dados');
    expect(situacao(35)).toBe('atencao');
    expect(situacao(62)).toBe('melhorando');
    expect(situacao(85)).toBe('em-dia');
  });

  it('maiorSequencia conta dias seguidos, ignorando repeticoes no mesmo dia', () => {
    const d = (dia: number, hora = 10) => new Date(2026, 6, dia, hora);
    expect(maiorSequencia([])).toBe(0);
    expect(maiorSequencia([d(1), d(2), d(2, 18), d(3), d(5), d(6)])).toBe(3);
  });

  it('idade considera se o aniversario ja passou', () => {
    expect(idade('2012-03-12', new Date(2026, 2, 11))).toBe(13);
    expect(idade('2012-03-12', new Date(2026, 2, 12))).toBe(14);
  });

  it('codigoTurma usa serie e letra, ou o nome antigo', () => {
    expect(codigoTurma('8º Ano', 'a', null)).toBe('8A');
    expect(codigoTurma(null, null, '9º Ano B')).toBe('9B');
  });
});

import { resumoSemanal } from './resumo-semanal';

describe('resumoSemanal', () => {
  const base = {
    primeiroNome: 'Lucas',
    semana: 72,
    iniciouSozinho: 3,
    materias: [
      { disciplina: 'Português', taxa: 85 },
      { disciplina: 'Matemática', taxa: 35 },
    ],
    sequenciaAtual: 5,
    recordeMes: 5,
  };

  it('fala da semana, da materia mais dificil e da sequencia recorde', () => {
    const texto = resumoSemanal(base);
    expect(texto).toContain('Lucas concluiu 72% das tarefas');
    expect(texto).toContain('iniciou 3 delas sozinho(a)');
    expect(texto).toContain('Matemática é o maior desafio');
    expect(texto).toContain('maior do mês');
  });

  it('sem tarefa vencida nao inventa porcentagem', () => {
    const texto = resumoSemanal({
      ...base,
      semana: null,
      materias: [],
      sequenciaAtual: 0,
    });
    expect(texto).toBe('Esta semana ainda não teve tarefa vencida para Lucas.');
  });

  it('elogia a melhor materia quando nenhuma esta abaixo de 60%', () => {
    const texto = resumoSemanal({
      ...base,
      materias: [{ disciplina: 'História', taxa: 90 }],
      sequenciaAtual: 1,
    });
    expect(texto).toContain('História está indo muito bem');
    expect(texto).not.toContain('sequência');
  });
});

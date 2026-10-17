/** Dados que o resumo da semana usa (todos ja calculados). */
export interface DadosResumo {
  primeiroNome: string;
  /** % de tarefas feitas na semana; null sem tarefa vencida. */
  semana: number | null;
  iniciouSozinho: number;
  materias: { disciplina: string; taxa: number | null }[];
  sequenciaAtual: number;
  recordeMes: number;
}

/**
 * "Resumo da semana - gerado pela Linka": texto montado por regras a partir
 * dos numeros (funciona sem IA). Fala com a familia em frases curtas.
 */
export function resumoSemanal(d: DadosResumo): string {
  const frases: string[] = [];

  if (d.semana === null) {
    frases.push(
      `Esta semana ainda não teve tarefa vencida para ${d.primeiroNome}.`,
    );
  } else {
    const sozinho =
      d.iniciouSozinho === 0
        ? 'ainda não começou nenhuma sozinho(a)'
        : `iniciou ${d.iniciouSozinho} delas sozinho(a), sem lembrete`;
    frases.push(
      `Esta semana ${d.primeiroNome} concluiu ${d.semana}% das tarefas e ${sozinho}.`,
    );
  }

  const comTaxa = d.materias.filter(
    (m): m is { disciplina: string; taxa: number } => m.taxa !== null,
  );
  const pior = [...comTaxa].sort((a, b) => a.taxa - b.taxa)[0];
  const melhor = [...comTaxa].sort((a, b) => b.taxa - a.taxa)[0];
  if (pior && pior.taxa < 60)
    frases.push(
      `${pior.disciplina} é o maior desafio agora: vale combinar um horário fixo para ela.`,
    );
  else if (melhor && melhor.taxa >= 80)
    frases.push(`${melhor.disciplina} está indo muito bem.`);

  if (d.sequenciaAtual >= 3)
    frases.push(
      d.sequenciaAtual >= d.recordeMes
        ? `A sequência de ${d.sequenciaAtual} dias é a maior do mês: ótimo momento para um elogio!`
        : `${d.primeiroNome} está numa sequência de ${d.sequenciaAtual} dias seguidos.`,
    );

  return frases.join(' ');
}

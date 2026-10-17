import { iso, maiorSequencia } from '../painel-escola/metricas';

/** Uma tarefa do aluno, como a gamificacao enxerga. */
export interface TarefaJogo {
  disciplina: string | null;
  concluida: boolean;
  concluidoEm: Date | null;
  iniciadoEm: Date | null;
  iniciouSozinho: boolean | null;
  totalPassos: number;
}

export const PONTOS_POR_TAREFA = 10;
export const BONUS_COMECOU_SOZINHO = 10;

/** +10 por tarefa concluida e +10 se o aluno comecou sem lembrete. */
export function pontosDaTarefa(t: TarefaJogo): number {
  if (!t.concluida) return 0;
  return PONTOS_POR_TAREFA + (t.iniciouSozinho ? BONUS_COMECOU_SOZINHO : 0);
}

export function pontos(
  tarefas: TarefaJogo[],
  hoje = new Date(),
): { total: number; hoje: number } {
  const dia = iso(hoje);
  let total = 0;
  let deHoje = 0;
  for (const t of tarefas) {
    const p = pontosDaTarefa(t);
    total += p;
    if (t.concluidoEm && iso(t.concluidoEm) === dia) deHoje += p;
  }
  return { total, hoje: deHoje };
}

const NIVEIS = [
  { minimo: 0, nome: 'Iniciante' },
  { minimo: 50, nome: 'Curioso' },
  { minimo: 150, nome: 'Aventureiro' },
  { minimo: 300, nome: 'Explorador' },
  { minimo: 500, nome: 'Desbravador' },
  { minimo: 800, nome: 'Mestre' },
  { minimo: 1200, nome: 'Lenda' },
];

export interface Nivel {
  numero: number;
  nome: string;
  /** Pontos que abrem o proximo nivel; null no ultimo. */
  proximo: number | null;
}

export function nivel(totalPontos: number): Nivel {
  let i = 0;
  while (i + 1 < NIVEIS.length && totalPontos >= NIVEIS[i + 1].minimo) i++;
  return {
    numero: i + 1,
    nome: NIVEIS[i].nome,
    proximo: NIVEIS[i + 1]?.minimo ?? null,
  };
}

/**
 * Dias seguidos com pelo menos uma tarefa concluida, terminando hoje (ou
 * ontem: a sequencia so quebra se o dia de hoje passar em branco).
 */
export function sequenciaAtual(datas: Date[], hoje = new Date()): number {
  const dias = new Set(datas.map(iso));
  const cursor = new Date(hoje);
  if (!dias.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1);

  let total = 0;
  while (dias.has(iso(cursor))) {
    total++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return total;
}

export interface Conquista {
  chave: string;
  titulo: string;
  descricao: string;
  meta: number;
  atual: number;
  desbloqueada: boolean;
}

const MINUTOS_FOCO = 25;
const ehLeitura = (d: string | null) =>
  !!d && /portugu|leitura|literat/i.test(d);
const ehMatematica = (d: string | null) => !!d && /matem/i.test(d);

/** As 8 conquistas da tela "Aluno - Conquistas", calculadas do historico. */
export function conquistas(tarefas: TarefaJogo[]): Conquista[] {
  const feitas = tarefas.filter((t) => t.concluida);
  const datas = feitas.flatMap((t) => (t.concluidoEm ? [t.concluidoEm] : []));
  const recorde = maiorSequencia(datas);
  const focadas = feitas.filter(
    (t) =>
      t.iniciadoEm &&
      t.concluidoEm &&
      t.concluidoEm.getTime() - t.iniciadoEm.getTime() >= MINUTOS_FOCO * 60_000,
  ).length;

  const lista: Omit<Conquista, 'desbloqueada'>[] = [
    {
      chave: 'primeiro-passo',
      titulo: 'Primeiro passo',
      descricao: 'Concluiu a primeira tarefa',
      meta: 1,
      atual: feitas.length,
    },
    {
      chave: 'sequencia-5',
      titulo: 'Sequência de 5',
      descricao: '5 dias seguidos',
      meta: 5,
      atual: recorde,
    },
    {
      chave: 'leitura',
      titulo: 'Mestre da leitura',
      descricao: '10 leituras concluídas',
      meta: 10,
      atual: feitas.filter((t) => ehLeitura(t.disciplina)).length,
    },
    {
      chave: 'autonomia',
      titulo: 'Autonomia',
      descricao: 'Começou 3 tarefas sozinho',
      meta: 3,
      atual: tarefas.filter((t) => t.iniciouSozinho === true).length,
    },
    {
      chave: 'foco',
      titulo: 'Foco total',
      descricao: `${MINUTOS_FOCO} min dedicados a uma tarefa`,
      meta: 1,
      atual: focadas,
    },
    {
      chave: 'organizado',
      titulo: 'Organizado',
      descricao: 'Fez 5 tarefas passo a passo',
      meta: 5,
      atual: feitas.filter((t) => t.totalPassos >= 3).length,
    },
    {
      chave: 'matematico',
      titulo: 'Matemático',
      descricao: '5 tarefas de Matemática',
      meta: 5,
      atual: feitas.filter((t) => ehMatematica(t.disciplina)).length,
    },
    {
      chave: 'sequencia-10',
      titulo: 'Sequência de 10',
      descricao: '10 dias seguidos',
      meta: 10,
      atual: recorde,
    },
  ];

  return lista.map((c) => ({
    ...c,
    atual: Math.min(c.atual, c.meta),
    desbloqueada: c.atual >= c.meta,
  }));
}

/** A conquista bloqueada mais perto de sair (ao menos metade do caminho). */
export function conquistaQuaseLa(lista: Conquista[]): Conquista | null {
  return (
    lista
      .filter((c) => !c.desbloqueada && c.meta > 1 && c.atual / c.meta >= 0.5)
      .sort((a, b) => b.atual / b.meta - a.atual / a.meta)[0] ?? null
  );
}

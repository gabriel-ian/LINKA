import { TarefaResumoAluno } from '../../core/model/painel-aluno.model';

const DIAS_LONGOS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function isoDe(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function hojeIso(): string {
  return isoDe(new Date());
}

/** 'AAAA-MM-DD' ao meio-dia local (sem pular de dia por fuso). */
export function dataDe(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/** "Terça-feira, 7 de julho" */
export function dataLonga(d = new Date()): string {
  return `${DIAS_LONGOS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/** "Semana de 6 a 10 de julho" */
export function intervaloSemana(inicio: string, fim: string): string {
  const a = dataDe(inicio);
  const b = dataDe(fim);
  return a.getMonth() === b.getMonth()
    ? `Semana de ${a.getDate()} a ${b.getDate()} de ${MESES[b.getMonth()]}`
    : `Semana de ${a.getDate()} de ${MESES[a.getMonth()]} a ${b.getDate()} de ${MESES[b.getMonth()]}`;
}

/** '18:00' -> '18h'; '18:30' -> '18h30'. */
export function horaCurta(hora: string | null): string {
  if (!hora) return '';
  const [h, m] = hora.split(':');
  return `${Number(h)}h${m && m !== '00' ? m : ''}`;
}

export type CorPrazo = 'verde' | 'laranja' | 'azul' | 'vermelho';

/** Etiqueta da tarefa como no Figma: "Concluída", "Urgente - 18h", "Amanhã - História". */
export function prazo(t: TarefaResumoAluno): { texto: string; cor: CorPrazo } {
  if (t.situacao === 'concluida') return { texto: 'Concluída', cor: 'verde' };
  const materia = t.disciplina ? ` - ${t.disciplina}` : '';
  if (!t.dataEntrega) return { texto: `Sem prazo${materia}`, cor: 'azul' };

  const hoje = hojeIso();
  if (t.dataEntrega < hoje) return { texto: 'Atrasada', cor: 'vermelho' };
  if (t.dataEntrega === hoje)
    return {
      texto: t.horaLimite ? `Urgente - ${horaCurta(t.horaLimite)}` : 'Hoje',
      cor: 'laranja',
    };

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  if (t.dataEntrega === isoDe(amanha)) return { texto: `Amanhã${materia}`, cor: 'azul' };

  const data = dataDe(t.dataEntrega);
  const dias = Math.round((data.getTime() - dataDe(hoje).getTime()) / 86_400_000);
  const quando =
    dias < 7
      ? DIAS_LONGOS[data.getDay()]
      : `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;
  return { texto: `${quando}${materia}`, cor: 'azul' };
}

/** "Exercícios 5 a 10 - Matemática" (sem repetir a materia se ja estiver no titulo). */
export function tituloCompleto(t: { titulo: string; disciplina: string | null }): string {
  return t.disciplina && !t.titulo.toLowerCase().includes(t.disciplina.toLowerCase())
    ? `${t.titulo} - ${t.disciplina}`
    : t.titulo;
}

export function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`;
}

/** Medalhas da tela "Aluno - Conquistas" (simbolo e cor do Figma). */
export const MEDALHAS: Record<string, { simbolo: string; cor: string }> = {
  'primeiro-passo': { simbolo: '1º', cor: '#0e996b' },
  'sequencia-5': { simbolo: '5', cor: '#ea6819' },
  leitura: { simbolo: 'A', cor: '#1558d6' },
  autonomia: { simbolo: 'S', cor: '#7c3aed' },
  foco: { simbolo: '25', cor: '#dc2626' },
  organizado: { simbolo: 'O', cor: '#0e996b' },
  matematico: { simbolo: 'M', cor: '#0e7490' },
  'sequencia-10': { simbolo: '10', cor: '#ea6819' },
};

export const COR_BLOQUEADA = '#c7c7c7';

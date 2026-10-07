import { Situacao, StatusProfessor, Turno } from '../../core/model/painel-escola.model';

/** Helpers de exibicao do painel da escola. */

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  atencao: 'Atenção',
  melhorando: 'Melhorando',
  'em-dia': 'Em dia',
  'sem-dados': 'Sem tarefas',
};

export const ROTULO_STATUS_PROFESSOR: Record<StatusProfessor, string> = {
  ativo: 'Ativo',
  pendente: 'Pendente',
  inativo: 'Inativo',
};

export const ROTULO_TURNO: Record<Turno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
  integral: 'Integral',
};

/** Paleta das turmas no Figma (azul, verde, laranja, roxo), em rodizio. */
export const CORES = ['azul', 'verde', 'laranja', 'roxo'] as const;
export type Cor = (typeof CORES)[number];

export function corDoIndice(indice: number): Cor {
  return CORES[indice % CORES.length];
}

/** Cor do aluno segue a situacao (Figma: laranja atencao, verde em dia, azul melhorando). */
export function corDaSituacao(s: Situacao): Cor | 'cinza' {
  return { atencao: 'laranja', melhorando: 'azul', 'em-dia': 'verde', 'sem-dados': 'cinza' }[s] as
    | Cor
    | 'cinza';
}

/** "Lucas Oliveira" -> "LO". */
export function iniciaisPessoa(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter((p) => p.length > 2 || /^[A-Z]/.test(p));
  const primeira = partes[0]?.[0] ?? '?';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export function percentual(valor: number | null): string {
  return valor === null ? '—' : `${valor}%`;
}

/** "2026-07" -> "Julho 2026". */
export function nomeMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  const nome = new Date(ano, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
  return `${nome[0].toUpperCase()}${nome.slice(1)} ${ano}`;
}

export function mesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "Matemática e Ciências" / "Matemática, Ciências e Artes". */
export function juntar(itens: string[]): string {
  if (itens.length <= 1) return itens[0] ?? '';
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/** Copia do conjunto com `valor` incluido ou removido (para chips selecionaveis). */
export function alternado<T>(conjunto: Set<T>, valor: T): Set<T> {
  const novo = new Set(conjunto);
  novo.has(valor) ? novo.delete(valor) : novo.add(valor);
  return novo;
}

import {
  StatusTarefa,
  TarefaRecente,
  TipoComunicado,
} from '../../core/model/painel-professor.model';
import { Cor } from '../escola/escola-ui';

/** Helpers de exibicao do painel do professor. */

export const ROTULO_TIPO: Record<TipoComunicado, string> = {
  atividade: 'Atividade',
  evento: 'Evento',
  material: 'Material',
  aviso: 'Aviso geral',
};

export const COR_TIPO: Record<TipoComunicado, Cor | 'cinza'> = {
  atividade: 'azul',
  evento: 'verde',
  material: 'laranja',
  aviso: 'cinza',
};

export const COR_STATUS: Record<StatusTarefa, Cor | 'cinza'> = {
  concluida: 'verde',
  hoje: 'laranja',
  amanha: 'azul',
  encerrada: 'cinza',
  futura: 'azul',
};

export function rotuloStatus(t: TarefaRecente): string {
  const hora = t.horaLimite
    ? ` - ${Number(t.horaLimite.slice(0, 2))}h${t.horaLimite.slice(3) === '00' ? '' : t.horaLimite.slice(3)}`
    : '';
  switch (t.status) {
    case 'concluida':
      return 'Concluída';
    case 'hoje':
      return `Hoje${hora}`;
    case 'amanha':
      return 'Amanhã';
    case 'encerrada':
      return 'Encerrada';
    default:
      return t.dataEntrega ? dataCurta(t.dataEntrega) : 'Sem prazo';
  }
}

/** "2026-07-07" -> "07/07". */
export function dataCurta(valor: string): string {
  const [, mes, dia] = valor.slice(0, 10).split('-');
  return `${dia}/${mes}`;
}

/** "Terça-feira, 7 de julho". */
export function hojePorExtenso(): string {
  const texto = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return texto[0].toUpperCase() + texto.slice(1);
}

/** "Hoje, 14h32" / "Ontem, 16h10" / "3 dias atrás". */
export function quandoRelativo(valor: string | null): string {
  if (!valor) return '—';
  const data = new Date(valor);
  const hoje = new Date();
  const dias = Math.round(
    (new Date(hoje.toDateString()).getTime() - new Date(data.toDateString()).getTime()) /
      86_400_000,
  );
  const hora = `${String(data.getHours()).padStart(2, '0')}h${String(data.getMinutes()).padStart(2, '0')}`;
  if (dias === 0) return `Hoje, ${hora}`;
  if (dias === 1) return `Ontem, ${hora}`;
  if (dias < 7) return `${dias} dias atrás`;
  if (dias < 14) return '1 semana atrás';
  return data.toLocaleDateString('pt-BR');
}

export function primeiroNome(nome: string): string {
  return nome.split(' ')[0];
}

/** Primeiro + segundo nome ("Ana Beatriz Souza" -> "Ana Beatriz"). */
export function nomeCurto(nome: string): string {
  return nome.split(' ').slice(0, 2).join(' ');
}

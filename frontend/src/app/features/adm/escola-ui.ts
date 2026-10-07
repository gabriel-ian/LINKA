import { Escola, PlanoEscola } from '../../core/model/escola.model';

/** Helpers de exibicao das escolas no painel ADM. */

export type StatusEscola = 'ativa' | 'inativa' | 'pendente';

export const ROTULO_STATUS: Record<StatusEscola, string> = {
  ativa: 'Ativa',
  inativa: 'Inativa',
  pendente: 'Pendente',
};

export const ROTULO_PLANO: Record<PlanoEscola, string> = {
  basico: 'Básico',
  institucional: 'Institucional',
};

export function statusEscola(e: Escola): StatusEscola {
  if (!e.ativo) return 'inativa';
  return e.pendente ? 'pendente' : 'ativa';
}

/** "E.E Leonardo da Vinci" -> "LV": primeira e ultima palavra relevantes. */
export function iniciais(nome: string): string {
  const palavras = nome
    .split(/\s+/)
    .filter((p) => p.length > 2 && !/\./.test(p) && !/^(da|de|do|das|dos)$/i.test(p));

  if (palavras.length === 0) return nome.slice(0, 2).toUpperCase();

  const primeira = palavras[0][0];
  const ultima = palavras.length > 1 ? palavras[palavras.length - 1][0] : palavras[0][1] ?? '';

  return (primeira + ultima).toUpperCase();
}

export function cidadeUf(e: Pick<Escola, 'cidade' | 'uf'>): string {
  return [e.cidade, e.uf].filter(Boolean).join(' - ');
}

/**
 * "2026-06-02" -> "02/06/2026". Data com hora (ISO em UTC) e convertida
 * para o fuso local antes: cortar a string mostraria o dia seguinte a noite.
 */
export function dataBr(valor: string | null | undefined): string {
  if (!valor) return '';
  if (valor.length > 10) return new Date(valor).toLocaleDateString('pt-BR');
  const [ano, mes, dia] = valor.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function hojeIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Le "Francisco Beltrão - PR" (ou "Cidade/PR") no campo unico "Cidade / UF" do Figma.
 * Devolve null se o formato nao bater.
 */
export function separarCidadeUf(texto: string): { cidade: string; uf: string } | null {
  const m = texto.trim().match(/^(.+?)\s*[-/]\s*([A-Za-z]{2})$/);
  return m ? { cidade: m[1].trim(), uf: m[2].toUpperCase() } : null;
}

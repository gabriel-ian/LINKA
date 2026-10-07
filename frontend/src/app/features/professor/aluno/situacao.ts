import { Situacao } from '../../../core/model/painel-escola.model';

/** Mesmas faixas do backend (metricas.ts): <50 atencao, <70 melhorando. */
export function situacaoDe(taxa: number | null): Situacao {
  if (taxa === null) return 'sem-dados';
  if (taxa < 50) return 'atencao';
  return taxa < 70 ? 'melhorando' : 'em-dia';
}

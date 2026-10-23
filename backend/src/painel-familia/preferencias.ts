/** Configuracoes da familia (tela "Familia - Configuracoes"). */
export interface PreferenciasFamilia {
  tarefaNaoIniciada: boolean;
  tarefaConcluida: boolean;
  avisosEscola: boolean;
  relatorioSemanal: boolean;
  resumoWhatsapp: boolean;
  /** Faixa para lembretes, ex.: '14h às 18h'. */
  horario: string;
}

export const PREFERENCIAS_PADRAO: PreferenciasFamilia = {
  tarefaNaoIniciada: true,
  tarefaConcluida: true,
  avisosEscola: true,
  relatorioSemanal: true,
  resumoWhatsapp: false,
  horario: '14h às 18h',
};

/** Preferencias salvas (JSON do banco, as vezes como texto) sobre o padrao. */
export function preferenciasDe(valor: unknown): PreferenciasFamilia {
  let salvas: unknown = valor;
  if (typeof valor === 'string') {
    try {
      salvas = JSON.parse(valor);
    } catch {
      salvas = null;
    }
  }
  return {
    ...PREFERENCIAS_PADRAO,
    ...(salvas && typeof salvas === 'object' ? salvas : {}),
  };
}

/** '14h às 18h' -> [14, 18]; formato desconhecido cai no padrao. */
export function faixaDoHorario(horario: string): [number, number] {
  const m = /(\d{1,2})h\D+(\d{1,2})h/.exec(horario);
  return m ? [Number(m[1]), Number(m[2])] : [14, 18];
}

/** Modelos das telas "Familia - ..." (/painel-familia). */
import { Nivel, Placar, TarefaResumoAluno } from './painel-aluno.model';

export interface PreferenciasFamilia {
  tarefaNaoIniciada: boolean;
  tarefaConcluida: boolean;
  avisosEscola: boolean;
  relatorioSemanal: boolean;
  resumoWhatsapp: boolean;
  horario: string;
}

export interface Filho {
  id: number;
  nome: string;
  primeiroNome: string;
  iniciais: string;
  turmaId: number | null;
  turma: string | null;
  escola: string;
}

export interface ContextoFamilia {
  responsavel: {
    id: number;
    nome: string;
    iniciais: string;
    sobrenome: string;
    email: string | null;
    telefone: string | null;
    parentesco: string | null;
    preferencias: PreferenciasFamilia;
  };
  filhos: Filho[];
  /** Termo de uso e privacidade (LGPD): pendente = ainda nao aceitou esta versao. */
  termo: { versao: string; pendente: boolean };
}

export interface EventoDia {
  cor: 'verde' | 'laranja' | 'cinza';
  titulo: string;
  detalhe: string;
}

export interface PainelFamilia extends Placar {
  filho: Filho;
  semana: number | null;
  avisosNaoLidos: number;
  alerta: TarefaResumoAluno | null;
  tarefas: TarefaResumoAluno[];
  autonomia: { sozinho: number; comLembrete: number; naoIniciada: number };
  porMateria: { disciplina: string; taxa: number | null }[];
  linhaDoTempo: EventoDia[];
}

export type TipoAviso = 'atividade' | 'evento' | 'material' | 'aviso';

export interface Aviso {
  id: number;
  tipo: TipoAviso;
  titulo: string;
  mensagem: string;
  simplificada: string | null;
  enviadoEm: string;
  autor: string;
  lido: boolean;
}

export interface AvisosFamilia {
  filho: Filho;
  avisos: Aviso[];
  resumoSemanal: string;
}

export interface RelatorioFamilia {
  filho: Filho;
  mes: string;
  rotuloMes: string;
  meses: { valor: string; rotulo: string }[];
  concluidas: number | null;
  iniciouSozinho: number;
  recorde: number;
  pontos: { total: number; hoje: number };
  nivel: Nivel;
  sequencia: { atual: number; recorde: number };
  resumo: string;
  porMateria: { disciplina: string; taxa: number | null }[];
  iniciadasPorSemana: { rotulo: string; sozinho: number }[];
}

export interface NovoIncentivo {
  mensagem: string;
  tarefaId?: number;
  voz: boolean;
}

export interface PerfilFamilia {
  nomeCompleto?: string;
  email?: string;
  telefone?: string;
  preferencias?: Partial<PreferenciasFamilia>;
}

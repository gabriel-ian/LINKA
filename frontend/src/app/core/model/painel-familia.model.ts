/** Modelos das telas "Familia - ..." (/painel-familia). */
import { Nivel, Placar, TarefaResumoAluno } from './painel-aluno.model';
import { Anexo } from './anexo.model';

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
  /** Texto sem formatacao. */
  mensagem: string;
  /** A mensagem com a formatacao do professor (HTML limpo). */
  mensagemHtml: string;
  simplificada: string | null;
  enviadoEm: string;
  autor: string;
  lido: boolean;
}

export interface TarefaDoFilho extends TarefaResumoAluno {
  professor: string | null;
  /** Quando o filho entregou a resposta escrita. */
  respostaEm: string | null;
  /** Fotos ou documentos que o filho enviou. */
  arquivos: Anexo[];
  /** Comentario ou correcao do professor. */
  comentario: string | null;
  comentarioEm: string | null;
}

/** A tarefa aberta pela familia (so leitura). */
export interface TarefaAbertaFilho extends TarefaDoFilho {
  enunciadoHtml: string | null;
  passos: string[];
  materiais: string[];
  resposta: string | null;
  anexos: Anexo[];
}

export interface TarefasDoFilho {
  filho: Filho;
  atrasadas: TarefaDoFilho[];
  aFazer: TarefaDoFilho[];
  /** As 50 ultimas feitas, da mais recente para a mais antiga. */
  feitas: TarefaDoFilho[];
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

/** A familia so muda os avisos; nome, e-mail e telefone quem muda e a escola. */
export interface PerfilFamilia {
  preferencias?: Partial<PreferenciasFamilia>;
}

/** Modelos das telas "Aluno - ..." (/painel-aluno). */

export type SituacaoTarefaAluno = 'pendente' | 'em-andamento' | 'concluida';
export type Mascote = 'dino' | 'coruja' | 'robo';

export interface PreferenciasAluno {
  ouvirVoz: boolean;
  passosCurtos: boolean;
  letrasMaiores: boolean;
  modoCalmo: boolean;
  mascote: Mascote;
}

export interface Nivel {
  numero: number;
  nome: string;
  /** Pontos do proximo nivel; null no ultimo. */
  proximo: number | null;
}

export interface Placar {
  pontos: { total: number; hoje: number };
  nivel: Nivel;
  sequencia: { atual: number; recorde: number };
}

export interface TarefaResumoAluno {
  id: number;
  titulo: string;
  disciplina: string | null;
  /** 'AAAA-MM-DD' */
  dataEntrega: string | null;
  /** 'HH:MM' */
  horaLimite: string | null;
  situacao: SituacaoTarefaAluno;
  passosFeitos: number;
  totalPassos: number;
  concluidoEm: string | null;
  /** O aluno ja entregou uma resposta escrita. */
  entregue?: boolean;
}

export interface ResumoAluno extends Placar {
  aluno: {
    id: number;
    nome: string;
    primeiroNome: string;
    iniciais: string;
    turma: string | null;
    idade: number | null;
  };
  preferencias: PreferenciasAluno;
  interesses: string[];
  /** % de tarefas feitas na semana (null sem tarefa vencida). */
  semana: number | null;
  tarefas: TarefaResumoAluno[];
  /** Mensagens da familia ainda nao vistas (ultimos 3 dias). */
  incentivos: IncentivoAluno[];
  /** Avisos da turma que o aluno ainda nao abriu. */
  avisosNaoLidos: number;
}

export interface AvisoAluno {
  id: number;
  tipo: 'atividade' | 'evento' | 'material' | 'aviso';
  titulo: string;
  /** HTML limpo pelo servidor. */
  mensagemHtml: string;
  /** Texto para ouvir (a versao simplificada, para NEE, quando houver). */
  texto: string;
  /** Versao simplificada pela IA (so para alunos NEE). */
  simplificada: string | null;
  enviadoEm: string;
  autor: string;
  lido: boolean;
}

export interface IncentivoAluno {
  id: number;
  mensagem: string;
  /** A familia pediu para o Dino ler em voz alta. */
  voz: boolean;
  criadoEm: string;
  /** "Mãe", "Pai" ou o primeiro nome de quem mandou. */
  de: string;
}

export interface TarefaAluno extends TarefaResumoAluno {
  objetivo: string;
  /** Enunciado com a formatacao do professor (HTML limpo). */
  enunciadoHtml: string | null;
  /** Resposta escrita entregue (HTML limpo). */
  resposta: string | null;
  respostaEm: string | null;
  professor: string | null;
  passos: string[];
  materiais: string[];
  /** false sem ANTHROPIC_API_KEY: a ajuda mostra so ouvir e avisar a professora. */
  iaDisponivel: boolean;
}

export interface Conquista {
  chave: string;
  titulo: string;
  descricao: string;
  meta: number;
  atual: number;
  desbloqueada: boolean;
}

export interface PassoConcluido {
  passosFeitos: number;
  concluida: boolean;
  /** So quando a tarefa termina: */
  ganhos?: number;
  comecouSozinho?: boolean;
  pontos?: Placar['pontos'];
  nivel?: Nivel;
  sequencia?: Placar['sequencia'];
  quaseLa?: Conquista | null;
}

export type TipoAjuda = 'explicar' | 'exemplo' | 'professora';

export interface RespostaAjuda {
  texto?: string;
  pergunta?: string;
  enviado?: boolean;
  professor?: string | null;
}

export interface ProgressoAluno extends Placar {
  semana: number | null;
  concluidasMes: number;
  dias: { data: string; rotulo: string; estado: 'feito' | 'hoje' | 'vazio' }[];
  porMateria: { disciplina: string; taxa: number | null }[];
  porSemana: { rotulo: string; inicio: string; concluidas: number }[];
}

export interface ConquistasAluno extends Placar {
  desbloqueadas: number;
  conquistas: Conquista[];
}

export interface Lembrete {
  id: number;
  texto: string;
  quando: string;
}

export interface AgendaAluno {
  inicio: string;
  fim: string;
  dias: { data: string; rotulo: string; tarefas: TarefaResumoAluno[] }[];
  lembretes: Lembrete[];
}

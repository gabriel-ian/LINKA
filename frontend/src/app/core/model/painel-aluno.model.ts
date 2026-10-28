import { Anexo } from './anexo.model';
/** Modelos das telas "Aluno - ..." (/painel-aluno). */

export type SituacaoTarefaAluno = 'pendente' | 'em-andamento' | 'concluida';
export type Mascote = 'dino' | 'coruja' | 'robo';

export interface PreferenciasAluno {
  ouvirVoz: boolean;
  passosCurtos: boolean;
  letrasMaiores: boolean;
  /** 0 normal, 1 grande, 2 maior, 3 enorme. */
  tamanhoLetra?: 0 | 1 | 2 | 3;
  modoCalmo: boolean;
  /** Fonte Lexend, com mais espaco entre letras e linhas. */
  fonteDislexia?: boolean;
  /** Texto preto, bordas fortes e cores mais escuras. */
  altoContraste?: boolean;
  /** Regua de leitura que acompanha o mouse ou o dedo. */
  reguaLeitura?: boolean;
  /** Relogio em cada passo, com pausa sugerida. */
  tempoPasso?: boolean;
  mascote: Mascote;
  /** Nome da voz do navegador; null = automatica. */
  voz?: string | null;
  velocidadeVoz?: 'devagar' | 'normal' | 'rapida';
  /** Quando salvou o desenho do Inicio (null = mostra o mascote). */
  desenhoEm?: string | null;
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
  /** O aluno ja entregou uma resposta escrita ou uma foto/documento. */
  entregue?: boolean;
  /** O professor deixou um comentario na entrega. */
  comentada?: boolean;
  /** O comentario em si (para ler direto da lista). */
  comentario?: string | null;
  /** A professora respondeu um pedido de ajuda nesta tarefa. */
  ajudaRespondida?: boolean;
  professor?: string | null;
  /** Ultima vez que o professor editou a tarefa. */
  atualizadaEm?: string | null;
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
  /** Materiais que a professora anexou. */
  anexos?: Anexo[];
  /** Fotos ou documentos que o aluno enviou da tarefa feita. */
  arquivosEnviados?: Anexo[];
  /** Comentario ou correcao da professora sobre a entrega. */
  comentario?: string | null;
  comentarioEm?: string | null;
  /** O que a professora escreveu para os pedidos de ajuda do aluno. */
  ajudasProfessora?: { passo: number | null; resposta: string; respondidoEm: string }[];
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

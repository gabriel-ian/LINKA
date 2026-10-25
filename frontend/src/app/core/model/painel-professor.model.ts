import { Situacao } from './painel-escola.model';

/** Tipos das rotas /painel-professor (telas "Professor - ..." do Figma). */

export interface TurmaProfessor {
  id: number;
  nome: string;
  codigo: string;
}

export interface PerfilProfessor {
  nome: string;
  email: string | null;
  ultimoAcesso: string | null;
  escola: string;
  disciplinas: string[];
  turmas: { id: number; nome: string; disciplinas: string[]; alunos: number; nee: number }[];
}

export interface ContextoProfessor {
  nome: string;
  escola: string;
  disciplinas: { id: number; nome: string }[];
  turmas: TurmaProfessor[];
  iaDisponivel: boolean;
}

export type StatusTarefa = 'concluida' | 'hoje' | 'amanha' | 'encerrada' | 'futura';

export interface TarefaRecente {
  id: number;
  titulo: string;
  disciplina: string | null;
  dataEntrega: string | null;
  horaLimite: string | null;
  entregues: number;
  total: number;
  status: StatusTarefa;
}

/** Linha da tela "Tarefas": tarefa recente + turma e adaptacoes. */
export interface TarefaListada extends TarefaRecente {
  turmaId: number;
  turma: string;
  totalNee: number;
  adaptadas: number;
}

export interface VisaoTurma {
  turma: TurmaProfessor & { totalAlunos: number; totalNee: number };
  alunosEmDia: number;
  alunosComAtraso: { id: number; nome: string; neurodivergente: boolean }[];
  avisosSemana: number;
  entregasSemana: number | null;
  alunosNee: {
    id: number;
    nome: string;
    diagnostico: string | null;
    desempenhoSemana: number | null;
    situacao: Situacao;
    resumo: string;
  }[];
  tarefasRecentes: TarefaRecente[];
  pedidosAjuda: PedidoAjuda[];
}

/** "Avisar a professora" na tela de ajuda do aluno (ainda nao visto). */
export interface PedidoAjuda {
  id: number;
  passo: number | null;
  criadoEm: string;
  alunoId: number;
  aluno: string;
  tarefaId: number;
  tarefa: string;
}

export interface AlunoDaTurma {
  id: number;
  nome: string;
  idade: number | null;
  neurodivergente: boolean;
  diagnosticos: string[];
  tarefasSemana: { concluidas: number; total: number };
  entregasMes: number | null;
  situacao: Situacao;
  atrasadas: number;
  ultimaAtividade: string | null;
}

export interface AlunosTurma {
  turma: TurmaProfessor & { disciplinas: { id: number; nome: string }[] };
  alunos: AlunoDaTurma[];
}

export interface AlunoProfessor {
  id: number;
  nome: string;
  turma: TurmaProfessor;
  idade: number | null;
  neurodivergente: boolean;
  diagnosticos: string[];
  dificuldades: string | null;
  pontosFortes: string | null;
  interesses: string[];
  desempenhoMes: number | null;
  tarefasMes: { concluidas: number; total: number };
  tarefasAdaptadasNoMes: number;
  progressoPorMateria: { disciplina: string; taxa: number | null }[];
  sugestoes: { tipo: 'horario' | 'adaptacao' | 'atraso' | 'materia'; texto: string }[];
}

export interface Adaptacao {
  alunoId: number;
  nome: string;
  diagnostico: string | null;
  passos: string[] | null;
  recursos: string[];
  geradoPorIa: boolean;
}

export interface TarefaProfessor {
  id: number;
  titulo: string;
  descricao: string | null;
  dataEntrega: string | null;
  horaLimite: string | null;
  turmaId: number;
  turma: string;
  disciplinaId: number | null;
  disciplina: string | null;
  totalAlunos: number;
  iaDisponivel: boolean;
  adaptacoes: Adaptacao[];
  /** Situacao de cada aluno da turma, com a resposta entregue. */
  entregas: EntregaAluno[];
  /** Pedidos de ajuda desta tarefa (abrir a tarefa marca como vistos). */
  pedidosAjuda: PedidoAjuda[];
}

export interface EntregaAluno {
  alunoId: number;
  nome: string;
  situacao: 'pendente' | 'em-andamento' | 'concluida';
  concluidoEm: string | null;
  /** HTML limpo pelo servidor. */
  resposta: string | null;
  respostaEm: string | null;
}

export interface NovaTarefa {
  titulo: string;
  /** HTML do editor. */
  descricao: string;
  turmaId: number;
  /** Outras turmas que recebem a mesma tarefa. */
  outrasTurmas?: number[];
  disciplinaId: number;
  dataEntrega: string;
  horaLimite?: string;
}

export type EdicaoTarefa = Partial<Omit<NovaTarefa, 'turmaId' | 'outrasTurmas'>>;

export type TipoComunicado = 'atividade' | 'evento' | 'material' | 'aviso';

export interface Comunicado {
  id: number;
  turmaId: number;
  turma: string;
  tipo: TipoComunicado;
  titulo: string;
  /** HTML limpo pelo servidor. */
  mensagem: string;
  /** A mesma mensagem sem formatacao. */
  texto: string;
  versaoSimplificada: string | null;
  enviadoEm: string | null;
  criadoEm: string;
  leituras: number;
  familias: number;
  rascunho: boolean;
}

export interface ListaComunicados {
  enviados: Comunicado[];
  rascunhos: Comunicado[];
  enviadosSemana: number;
}

export interface NovoComunicado {
  id?: number;
  turmaId: number;
  tipo: TipoComunicado;
  titulo: string;
  mensagem: string;
  simplificada: boolean;
  rascunho: boolean;
}

export interface ComunicadoSalvo {
  id: number;
  turma: string;
  enviado: boolean;
  familias: number;
  alunosNee: number;
  versaoSimplificada: string | null;
  avisoIa: string | null;
}

export interface RelatorioProfessor {
  turma: TurmaProfessor;
  mes: string;
  entregasNoPrazo: number | null;
  neeEmDia: number | null;
  tarefasCriadas: number;
  adaptacoesIa: number;
  evolucaoNee: {
    id: number;
    nome: string;
    diagnostico: string | null;
    taxa: number | null;
    variacao: number | null;
  }[];
  entregasPorSemana: { rotulo: string; taxa: number | null }[];
  sugestao: string | null;
}

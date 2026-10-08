/** Tipos das rotas /painel-escola (telas "Escola - ..." do Figma). */

export type Situacao = 'atencao' | 'melhorando' | 'em-dia' | 'sem-dados';
export type Turno = 'manha' | 'tarde' | 'noite' | 'integral';
export type StatusProfessor = 'ativo' | 'pendente' | 'inativo';

export interface ProfessorDaTurma {
  id: number;
  nome: string;
  disciplinas: string[];
}

export interface TurmaResumo {
  id: number;
  nome: string;
  codigo: string;
  serie: string | null;
  letra: string | null;
  turno: Turno | null;
  anoLetivo: number | null;
  sala: string | null;
  limiteAlunos: number | null;
  criadoEm: string;
  totalAlunos: number;
  totalNee: number;
  professores: ProfessorDaTurma[];
  desempenho: number | null;
}

export interface AlunoResumo {
  id: number;
  nome: string;
  cgm: string | null;
  neurodivergente: boolean;
  turma: { id: number; nome: string; codigo: string } | null;
  diagnosticos: string[];
  desempenhoSemana: number | null;
  situacao: Situacao;
}

export interface TurmaDetalhe extends TurmaResumo {
  entregasNoPrazo: number | null;
  tarefasNoMes: number;
  tarefasAdaptadasNoMes: number;
  alunosNee: AlunoResumo[];
}

export interface ProfessorResumo {
  id: number;
  nome: string;
  email: string | null;
  disciplinas: string[];
  turmas: { id: number; codigo: string }[];
  status: StatusProfessor;
}

export interface AlunoDetalhe extends AlunoResumo {
  dataNascimento: string | null;
  idade: number | null;
  email: string | null;
  laudo: { enviadoEm: string } | null;
  dificuldades: string | null;
  pontosFortes: string | null;
  interesses: string[];
  professores: ProfessorDaTurma[];
  responsaveis: {
    id: number;
    nome: string | null;
    telefone: string | null;
    parentesco: string | null;
    email: string | null;
    acessou: boolean;
  }[];
  tarefasMes: { concluidas: number; total: number };
  tarefasAdaptadasNoMes: number;
  maiorSequencia: number;
}

export interface Relatorio {
  mes: string;
  taxaConclusao: number | null;
  entregasNoPrazo: number | null;
  tarefasCriadas: number;
  tarefasAdaptadas: number;
  porTurma: { id: number; nome: string; taxa: number | null }[];
  evolucao: { mes: string; taxa: number | null }[];
}

export interface Opcoes {
  disciplinas: { id: number; nome: string }[];
  diagnosticos: { id: number; nome: string }[];
  turmas: { id: number; nome: string; codigo: string }[];
  professores: { id: number; nome: string; disciplinas: string[] }[];
}

export interface NovaTurma {
  serie: string;
  letra: string;
  turno: Turno;
  anoLetivo: number;
  /** null limpa o campo na edicao. */
  sala?: string | null;
  limiteAlunos?: number | null;
  professorIds: number[];
}

export interface NovoProfessor {
  nomeCompleto: string;
  email: string;
  senha: string;
  disciplinas: string[];
  turmaIds: number[];
}

export interface NovoAluno {
  nomeCompleto: string;
  dataNascimento?: string;
  cgm?: string;
  turmaId?: number;
  email?: string;
  senha?: string;
  diagnosticoIds: number[];
  prefiroNaoInformar: boolean;
  responsavel?: {
    nomeCompleto: string;
    email: string;
    telefone?: string;
    parentesco?: string;
  };
}

export interface AlunoCriado {
  id: number;
  nome: string;
  turma: { id: number; nome: string } | null;
  responsavel: { nome: string; email: string; senhaProvisoria: string | null } | null;
}

/** Senha provisoria gerada pela escola ou pelo ADM (mostrada uma vez). */
export interface SenhaGerada {
  email: string;
  senhaProvisoria: string;
}

/** Perfil de aprendizagem; null limpa o campo. */
export interface PerfilAprendizagem {
  dificuldades?: string | null;
  pontosFortes?: string | null;
  interesses?: string[];
}

/** Edicao do aluno: so os campos enviados mudam. */
export interface EdicaoAluno extends PerfilAprendizagem {
  nomeCompleto?: string;
  dataNascimento?: string | null;
  cgm?: string | null;
  turmaId?: number | null;
  diagnosticoIds?: number[];
  prefiroNaoInformar?: boolean;
}

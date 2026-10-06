/** Envelope padrao das respostas da API: { data: ... } */
export interface ApiResponse<T> {
  data: T;
}

export type PlanoEscola = 'basico' | 'institucional';

export interface Escola {
  id: number;
  nome: string;
  cnpj: string | null;
  inep: string | null;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  responsavel: string | null;
  telefone: string | null;
  plano: PlanoEscola;
  limiteProfessores: number | null;
  limiteAlunosNee: number | null;
  ativo: boolean;
  desativadaEm: string | null;
  motivoDesativacao: string | null;
  observacaoDesativacao: string | null;
  criado_em: string;
  atualizadoEm: string | null;
  atualizadoPor: string | null;

  /** E-mail de login da coordenacao (usuario perfil escola). */
  email: string | null;
  /** Ativa, mas a coordenacao ainda nao fez o primeiro login. */
  pendente: boolean;
  totalAlunosNee: number;
  totalProfessores: number;
  totalTurmas: number;
}

/** Campos editaveis pelo ADM. null limpa o campo na edicao. */
export interface EscolaDados {
  nome: string;
  inep?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  responsavel?: string | null;
  telefone?: string | null;
  plano: PlanoEscola;
  limiteProfessores?: number | null;
  limiteAlunosNee?: number | null;
  email: string;
}

export interface NovaEscola extends EscolaDados {
  senha: string;
}

export const MOTIVOS_DESATIVACAO = [
  'Fim do contrato',
  'Solicitação da escola',
  'Pagamento pendente',
  'Outro',
] as const;

export type MotivoDesativacao = (typeof MOTIVOS_DESATIVACAO)[number];

export interface Desativacao {
  motivo: MotivoDesativacao;
  /** yyyy-mm-dd */
  data: string;
  observacao?: string;
}

export type PerfilUsuario = 'admin' | 'escola' | 'professor' | 'responsavel';

export interface LoginResponse {
  access_token: string;
  perfil: PerfilUsuario;
  escolaId: number | null;
}

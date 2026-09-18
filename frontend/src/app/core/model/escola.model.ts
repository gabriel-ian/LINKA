/** Envelope padrao das respostas da API: { data: ... } */
export interface ApiResponse<T> {
  data: T;
}

export interface Escola {
  id: number;
  nome: string;
  cnpj: string | null;
  ativo: boolean;
  criado_em: string;
}

export type PerfilUsuario = 'admin' | 'escola' | 'professor' | 'responsavel';

export interface LoginResponse {
  access_token: string;
  perfil: PerfilUsuario;
  escolaId: number | null;
}

import { PerfilUsuario } from '../model/escola.model';

/** Primeira tela de cada perfil depois do login. */
export function rotaInicial(perfil: PerfilUsuario | null): string {
  switch (perfil) {
    case 'admin':
      return '/adm';
    case 'escola':
      return '/escola';
    case 'professor':
      return '/professor';
    case 'aluno':
      return '/aluno';
    case 'responsavel':
      return '/familia';
    default:
      return '/login';
  }
}

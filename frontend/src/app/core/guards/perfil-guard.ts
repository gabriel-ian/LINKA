import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { PerfilUsuario } from '../model/escola.model';

/**
 * Libera a rota so para os perfis informados. Usar junto do authGuard,
 * que confere o token. A protecao real continua no backend (RolesGuard).
 */
export const perfilGuard =
  (...perfis: PerfilUsuario[]): CanActivateFn =>
  () => {
    const perfil = inject(AuthService).perfil;

    return perfil && perfis.includes(perfil) ? true : inject(Router).createUrlTree(['/login']);
  };

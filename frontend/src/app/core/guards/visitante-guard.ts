import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { rotaInicial } from '../services/rota-inicial';

/** Telas de entrada: quem ja esta logado vai direto para o proprio painel. */
export const visitanteGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.logado && auth.perfil ? inject(Router).createUrlTree([rotaInicial(auth.perfil)]) : true;
};

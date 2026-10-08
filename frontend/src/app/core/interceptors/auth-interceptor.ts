import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Envia o token e, se a API responder 401 (token expirado, invalido ou
 * conta desativada), encerra a sessao e volta para o login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError((erro: unknown) => {
      // No proprio login o 401 significa senha errada: a tela trata.
      if (
        erro instanceof HttpErrorResponse &&
        erro.status === 401 &&
        token &&
        !req.url.endsWith('/auth/login')
      ) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { sessao: 'encerrada' } });
      }
      return throwError(() => erro);
    }),
  );
};

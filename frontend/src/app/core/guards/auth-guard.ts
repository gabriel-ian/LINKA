import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token = localStorage.getItem('token');

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  try {
    const payloadBase64 = token.split('.')[1];

    if (!payloadBase64) {
      throw new Error('Token inválido');
    }

    const payload = JSON.parse(atob(payloadBase64));

    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return router.createUrlTree(['/login']);
    }

    return true;
  } catch {
    localStorage.removeItem('token');
    return router.createUrlTree(['/login']);
  }
};

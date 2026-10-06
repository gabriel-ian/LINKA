import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginResponse, PerfilUsuario } from '../model/escola.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private readonly api = 'http://localhost:3000/auth';

  /**
   * O perfil nao e mais enviado: quem define o perfil e o backend,
   * a partir da tabela usuario.
   */
  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login`, {
      email,
      senha,
    });
  }

  /** Pede o link de nova senha. Depende da rota POST /auth/recuperar-senha no backend. */
  recuperarSenha(email: string): Observable<void> {
    return this.http.post<void>(`${this.api}/recuperar-senha`, { email });
  }

  guardarSessao(res: LoginResponse): void {
    localStorage.setItem('token', res.access_token);
    localStorage.setItem('perfil', res.perfil);

    if (res.escolaId !== null && res.escolaId !== undefined) {
      localStorage.setItem('escolaId', String(res.escolaId));
    } else {
      localStorage.removeItem('escolaId');
    }
  }

  get perfil(): PerfilUsuario | null {
    return localStorage.getItem('perfil') as PerfilUsuario | null;
  }

  /** E-mail lido do payload do token (so para exibir; nao e verificado aqui). */
  get email(): string | null {
    const token = localStorage.getItem('token');

    try {
      return token ? JSON.parse(atob(token.split('.')[1])).email ?? null : null;
    } catch {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('perfil');
    localStorage.removeItem('escolaId');
  }
}

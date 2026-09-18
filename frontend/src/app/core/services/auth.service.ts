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

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('perfil');
    localStorage.removeItem('escolaId');
  }
}

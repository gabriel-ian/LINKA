import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, Escola } from '../model/escola.model';

@Injectable({
  providedIn: 'root',
})
export class EscolaService {
  private http = inject(HttpClient);

  private readonly api = 'http://localhost:3000';

  /** CRUD de escolas: exclusivo do admin. */
  private readonly adminUrl = `${this.api}/admin/escolas`;

  listar(): Observable<ApiResponse<Escola[]>> {
    return this.http.get<ApiResponse<Escola[]>>(this.adminUrl);
  }

  /** Escola do usuario logado (perfil escola ou professor). */
  minhaEscola(): Observable<ApiResponse<Escola>> {
    return this.http.get<ApiResponse<Escola>>(`${this.api}/escolas/me`);
  }

  cadastrar(nome: string, cnpj?: string): Observable<ApiResponse<Escola>> {
    return this.http.post<ApiResponse<Escola>>(this.adminUrl, {
      nome,
      ...(cnpj ? { cnpj } : {}),
    });
  }

  atualizar(id: number, nome: string): Observable<ApiResponse<Escola>> {
    return this.http.patch<ApiResponse<Escola>>(`${this.adminUrl}/${id}`, {
      nome,
    });
  }

  desativar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.adminUrl}/${id}`);
  }

  ativar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(
      `${this.adminUrl}/${id}/ativar`,
      {},
    );
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  Desativacao,
  Escola,
  EscolaDados,
  NovaEscola,
} from '../model/escola.model';

@Injectable({
  providedIn: 'root',
})
export class EscolaService {
  private http = inject(HttpClient);

  private readonly api = `${environment.apiUrl}`;

  /** CRUD de escolas: exclusivo do admin. */
  private readonly adminUrl = `${this.api}/admin/escolas`;

  listar(): Observable<ApiResponse<Escola[]>> {
    return this.http.get<ApiResponse<Escola[]>>(this.adminUrl);
  }

  buscarPorId(id: number): Observable<ApiResponse<Escola>> {
    return this.http.get<ApiResponse<Escola>>(`${this.adminUrl}/${id}`);
  }

  /** Escola do usuario logado (perfil escola ou professor). */
  minhaEscola(): Observable<ApiResponse<Escola>> {
    return this.http.get<ApiResponse<Escola>>(`${this.api}/escolas/me`);
  }

  /** Cria a escola e o login da coordenacao (e-mail + senha). */
  cadastrar(dados: NovaEscola): Observable<ApiResponse<Escola>> {
    return this.http.post<ApiResponse<Escola>>(this.adminUrl, dados);
  }

  atualizar(id: number, dados: Partial<EscolaDados>): Observable<ApiResponse<Escola>> {
    return this.http.patch<ApiResponse<Escola>>(`${this.adminUrl}/${id}`, dados);
  }

  desativar(id: number, dados: Desativacao): Observable<ApiResponse<Escola>> {
    return this.http.patch<ApiResponse<Escola>>(`${this.adminUrl}/${id}/desativar`, dados);
  }

  ativar(id: number): Observable<ApiResponse<boolean>> {
    return this.http.patch<ApiResponse<boolean>>(`${this.adminUrl}/${id}/ativar`, {});
  }
}

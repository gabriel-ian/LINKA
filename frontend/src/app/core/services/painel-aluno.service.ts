import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../model/escola.model';
import {
  AgendaAluno,
  ConquistasAluno,
  Lembrete,
  PassoConcluido,
  PreferenciasAluno,
  ProgressoAluno,
  RespostaAjuda,
  ResumoAluno,
  TarefaAluno,
  TipoAjuda,
} from '../model/painel-aluno.model';

/** Rotas do perfil aluno (/painel-aluno). O aluno vem do token. */
@Injectable({ providedIn: 'root' })
export class PainelAlunoService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/painel-aluno`;

  resumo(): Observable<ApiResponse<ResumoAluno>> {
    return this.http.get<ApiResponse<ResumoAluno>>(`${this.api}/resumo`);
  }

  tarefa(id: number): Observable<ApiResponse<TarefaAluno>> {
    return this.http.get<ApiResponse<TarefaAluno>>(`${this.api}/tarefas/${id}`);
  }

  concluirPasso(id: number, passo: number): Observable<ApiResponse<PassoConcluido>> {
    return this.http.post<ApiResponse<PassoConcluido>>(`${this.api}/tarefas/${id}/passos`, {
      passo,
    });
  }

  ajuda(id: number, tipo: TipoAjuda, passo: number): Observable<ApiResponse<RespostaAjuda>> {
    return this.http.post<ApiResponse<RespostaAjuda>>(`${this.api}/tarefas/${id}/ajuda`, {
      tipo,
      passo,
    });
  }

  progresso(): Observable<ApiResponse<ProgressoAluno>> {
    return this.http.get<ApiResponse<ProgressoAluno>>(`${this.api}/progresso`);
  }

  conquistas(): Observable<ApiResponse<ConquistasAluno>> {
    return this.http.get<ApiResponse<ConquistasAluno>>(`${this.api}/conquistas`);
  }

  agenda(semana?: string): Observable<ApiResponse<AgendaAluno>> {
    const params = semana ? new HttpParams().set('semana', semana) : undefined;
    return this.http.get<ApiResponse<AgendaAluno>>(`${this.api}/agenda`, { params });
  }

  criarLembrete(texto: string, quando: string): Observable<ApiResponse<Lembrete>> {
    return this.http.post<ApiResponse<Lembrete>>(`${this.api}/lembretes`, { texto, quando });
  }

  removerLembrete(id: number): Observable<unknown> {
    return this.http.delete(`${this.api}/lembretes/${id}`);
  }

  marcarIncentivoLido(id: number): Observable<unknown> {
    return this.http.post(`${this.api}/incentivos/${id}/lido`, {});
  }

  salvarPreferencias(
    dados: Partial<PreferenciasAluno> & { interesses?: string[] },
  ): Observable<ApiResponse<ResumoAluno>> {
    return this.http.patch<ApiResponse<ResumoAluno>>(`${this.api}/preferencias`, dados);
  }
}

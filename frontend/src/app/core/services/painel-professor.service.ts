import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../model/escola.model';
import {
  AlunoProfessor,
  AlunosTurma,
  ComunicadoSalvo,
  ContextoProfessor,
  ListaComunicados,
  NovaTarefa,
  NovoComunicado,
  RelatorioProfessor,
  TarefaListada,
  TarefaProfessor,
  VisaoTurma,
} from '../model/painel-professor.model';

/** Rotas do perfil professor (/painel-professor). */
@Injectable({ providedIn: 'root' })
export class PainelProfessorService {
  private http = inject(HttpClient);
  private readonly api = 'http://localhost:3000/painel-professor';

  contexto(): Observable<ApiResponse<ContextoProfessor>> {
    return this.http.get<ApiResponse<ContextoProfessor>>(`${this.api}/contexto`);
  }

  visao(turmaId: number): Observable<ApiResponse<VisaoTurma>> {
    return this.http.get<ApiResponse<VisaoTurma>>(`${this.api}/turmas/${turmaId}/visao`);
  }

  alunos(turmaId: number): Observable<ApiResponse<AlunosTurma>> {
    return this.http.get<ApiResponse<AlunosTurma>>(`${this.api}/turmas/${turmaId}/alunos`);
  }

  aluno(id: number): Observable<ApiResponse<AlunoProfessor>> {
    return this.http.get<ApiResponse<AlunoProfessor>>(`${this.api}/alunos/${id}`);
  }

  criarTarefa(dados: NovaTarefa): Observable<ApiResponse<{ id: number }>> {
    return this.http.post<ApiResponse<{ id: number }>>(`${this.api}/tarefas`, dados);
  }

  tarefas(turmaId?: number): Observable<ApiResponse<TarefaListada[]>> {
    const params = turmaId ? new HttpParams().set('turmaId', turmaId) : undefined;
    return this.http.get<ApiResponse<TarefaListada[]>>(`${this.api}/tarefas`, { params });
  }

  tarefa(id: number): Observable<ApiResponse<TarefaProfessor>> {
    return this.http.get<ApiResponse<TarefaProfessor>>(`${this.api}/tarefas/${id}`);
  }

  /** Gera com IA as versoes que faltam; com alunoId, refaz so a dele. */
  adaptar(id: number, alunoId?: number): Observable<ApiResponse<TarefaProfessor>> {
    const params = alunoId ? new HttpParams().set('alunoId', alunoId) : undefined;
    return this.http.post<ApiResponse<TarefaProfessor>>(`${this.api}/tarefas/${id}/adaptar`, {}, { params });
  }

  editarAdaptacao(id: number, alunoId: number, passos: string[]): Observable<ApiResponse<TarefaProfessor>> {
    return this.http.put<ApiResponse<TarefaProfessor>>(`${this.api}/tarefas/${id}/adaptacoes/${alunoId}`, { passos });
  }

  comunicados(): Observable<ApiResponse<ListaComunicados>> {
    return this.http.get<ApiResponse<ListaComunicados>>(`${this.api}/comunicados`);
  }

  salvarComunicado(dados: NovoComunicado): Observable<ApiResponse<ComunicadoSalvo>> {
    return this.http.post<ApiResponse<ComunicadoSalvo>>(`${this.api}/comunicados`, dados);
  }

  relatorio(turmaId: number, mes: string, alunos: 'todos' | 'nee'): Observable<ApiResponse<RelatorioProfessor>> {
    const params = new HttpParams().set('turmaId', turmaId).set('mes', mes).set('alunos', alunos);
    return this.http.get<ApiResponse<RelatorioProfessor>>(`${this.api}/relatorio`, { params });
  }
}

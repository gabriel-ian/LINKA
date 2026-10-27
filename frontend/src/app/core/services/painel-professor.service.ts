import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../model/escola.model';
import { Anexo } from '../model/anexo.model';
import { PerfilAprendizagem } from '../model/painel-escola.model';
import {
  AlunoProfessor,
  AlunosTurma,
  ComunicadoSalvo,
  ContextoProfessor,
  EdicaoTarefa,
  PerfilProfessor,
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
  private readonly api = `${environment.apiUrl}/painel-professor`;

  contexto(): Observable<ApiResponse<ContextoProfessor>> {
    return this.http.get<ApiResponse<ContextoProfessor>>(`${this.api}/contexto`);
  }

  perfil(): Observable<ApiResponse<PerfilProfessor>> {
    return this.http.get<ApiResponse<PerfilProfessor>>(`${this.api}/perfil`);
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

  editarPerfilAluno(
    id: number,
    perfil: PerfilAprendizagem,
  ): Observable<ApiResponse<AlunoProfessor>> {
    return this.http.patch<ApiResponse<AlunoProfessor>>(`${this.api}/alunos/${id}/perfil`, perfil);
  }

  criarTarefa(dados: NovaTarefa): Observable<ApiResponse<{ id: number; ids: number[] }>> {
    return this.http.post<ApiResponse<{ id: number; ids: number[] }>>(`${this.api}/tarefas`, dados);
  }

  /** Mudar o enunciado apaga as adaptacoes de quem ainda nao comecou. */
  editarTarefa(
    id: number,
    dados: EdicaoTarefa,
  ): Observable<ApiResponse<{ id: number; adaptacoesRefazer: number }>> {
    return this.http.patch<ApiResponse<{ id: number; adaptacoesRefazer: number }>>(
      `${this.api}/tarefas/${id}`,
      dados,
    );
  }

  anexar(id: number, arquivos: File[]): Observable<ApiResponse<Anexo[]>> {
    const form = new FormData();
    for (const a of arquivos) form.append('arquivos', a, a.name);
    return this.http.post<ApiResponse<Anexo[]>>(`${this.api}/tarefas/${id}/anexos`, form);
  }

  removerAnexo(id: number, anexoId: number): Observable<ApiResponse<Anexo[]>> {
    return this.http.delete<ApiResponse<Anexo[]>>(`${this.api}/tarefas/${id}/anexos/${anexoId}`);
  }

  /** Vem como blob: o arquivo exige o token (um link direto nao levaria o header). */
  baixarAnexo(id: number, anexoId: number): Observable<Blob> {
    return this.http.get(`${this.api}/tarefas/${id}/anexos/${anexoId}`, { responseType: 'blob' });
  }

  excluirTarefa(id: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(`${this.api}/tarefas/${id}`);
  }

  copiarTarefa(id: number, turmaIds: number[]): Observable<ApiResponse<{ ids: number[] }>> {
    return this.http.post<ApiResponse<{ ids: number[] }>>(`${this.api}/tarefas/${id}/copiar`, {
      turmaIds,
    });
  }

  tarefas(turmaId?: number): Observable<ApiResponse<TarefaListada[]>> {
    const params = turmaId ? new HttpParams().set('turmaId', turmaId) : undefined;
    return this.http.get<ApiResponse<TarefaListada[]>>(`${this.api}/tarefas`, { params });
  }

  tarefa(id: number): Observable<ApiResponse<TarefaProfessor>> {
    return this.http.get<ApiResponse<TarefaProfessor>>(`${this.api}/tarefas/${id}`);
  }

  /** Gera com IA as versoes que faltam; com alunoId, refaz so a dele. */
  /** Com pedido (e alunoId), a IA refaz a versao atual do aluno aplicando a mudanca. */
  adaptar(id: number, alunoId?: number, pedido?: string): Observable<ApiResponse<TarefaProfessor>> {
    const params = alunoId ? new HttpParams().set('alunoId', alunoId) : undefined;
    return this.http.post<ApiResponse<TarefaProfessor>>(
      `${this.api}/tarefas/${id}/adaptar`,
      pedido ? { pedido } : {},
      { params },
    );
  }

  editarAdaptacao(
    id: number,
    alunoId: number,
    passos: string[],
  ): Observable<ApiResponse<TarefaProfessor>> {
    return this.http.put<ApiResponse<TarefaProfessor>>(
      `${this.api}/tarefas/${id}/adaptacoes/${alunoId}`,
      { passos },
    );
  }

  comunicados(): Observable<ApiResponse<ListaComunicados>> {
    return this.http.get<ApiResponse<ListaComunicados>>(`${this.api}/comunicados`);
  }

  salvarComunicado(dados: NovoComunicado): Observable<ApiResponse<ComunicadoSalvo>> {
    return this.http.post<ApiResponse<ComunicadoSalvo>>(`${this.api}/comunicados`, dados);
  }

  relatorio(
    turmaId: number,
    mes: string,
    alunos: 'todos' | 'nee',
  ): Observable<ApiResponse<RelatorioProfessor>> {
    const params = new HttpParams().set('turmaId', turmaId).set('mes', mes).set('alunos', alunos);
    return this.http.get<ApiResponse<RelatorioProfessor>>(`${this.api}/relatorio`, { params });
  }
}

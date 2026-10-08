import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../model/escola.model';
import {
  AlunoCriado,
  AlunoDetalhe,
  AlunoResumo,
  EdicaoAluno,
  NovaTurma,
  NovoAluno,
  NovoProfessor,
  Opcoes,
  ProfessorResumo,
  Relatorio,
  SenhaGerada,
  TurmaDetalhe,
  TurmaResumo,
} from '../model/painel-escola.model';

/** Rotas do perfil escola (/painel-escola). */
@Injectable({ providedIn: 'root' })
export class PainelEscolaService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/painel-escola`;

  opcoes(): Observable<ApiResponse<Opcoes>> {
    return this.http.get<ApiResponse<Opcoes>>(`${this.api}/opcoes`);
  }

  turmas(): Observable<ApiResponse<TurmaResumo[]>> {
    return this.http.get<ApiResponse<TurmaResumo[]>>(`${this.api}/turmas`);
  }

  turma(id: number): Observable<ApiResponse<TurmaDetalhe>> {
    return this.http.get<ApiResponse<TurmaDetalhe>>(`${this.api}/turmas/${id}`);
  }

  criarTurma(dados: NovaTurma): Observable<ApiResponse<{ id: number; nome: string }>> {
    return this.http.post<ApiResponse<{ id: number; nome: string }>>(`${this.api}/turmas`, dados);
  }

  editarTurma(id: number, dados: Partial<NovaTurma>): Observable<unknown> {
    return this.http.patch(`${this.api}/turmas/${id}`, dados);
  }

  editarAluno(id: number, dados: EdicaoAluno): Observable<unknown> {
    return this.http.patch(`${this.api}/alunos/${id}`, dados);
  }

  /** Gera senha provisoria para professor, aluno ou responsavel. */
  redefinirSenha(tipo: 'professores' | 'alunos' | 'responsaveis', id: number): Observable<ApiResponse<SenhaGerada>> {
    return this.http.post<ApiResponse<SenhaGerada>>(`${this.api}/${tipo}/${id}/senha`, {});
  }

  professores(): Observable<ApiResponse<ProfessorResumo[]>> {
    return this.http.get<ApiResponse<ProfessorResumo[]>>(`${this.api}/professores`);
  }

  criarProfessor(dados: NovoProfessor): Observable<ApiResponse<{ id: number; nome: string; email: string }>> {
    return this.http.post<ApiResponse<{ id: number; nome: string; email: string }>>(`${this.api}/professores`, dados);
  }

  definirProfessorAtivo(id: number, ativo: boolean): Observable<unknown> {
    return this.http.patch(`${this.api}/professores/${id}`, { ativo });
  }

  alunos(): Observable<ApiResponse<AlunoResumo[]>> {
    return this.http.get<ApiResponse<AlunoResumo[]>>(`${this.api}/alunos`);
  }

  aluno(id: number): Observable<ApiResponse<AlunoDetalhe>> {
    return this.http.get<ApiResponse<AlunoDetalhe>>(`${this.api}/alunos/${id}`);
  }

  criarAluno(dados: NovoAluno): Observable<ApiResponse<AlunoCriado>> {
    return this.http.post<ApiResponse<AlunoCriado>>(`${this.api}/alunos`, dados);
  }

  enviarLaudo(alunoId: number, arquivo: File): Observable<unknown> {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return this.http.post(`${this.api}/alunos/${alunoId}/laudo`, form);
  }

  /** O laudo exige o token, entao vem como blob (um link direto nao levaria o header). */
  baixarLaudo(alunoId: number): Observable<Blob> {
    return this.http.get(`${this.api}/alunos/${alunoId}/laudo`, { responseType: 'blob' });
  }

  relatorio(filtros: { mes?: string; turmaId?: number; diagnosticoId?: number }): Observable<ApiResponse<Relatorio>> {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') params = params.set(chave, String(valor));
    }
    return this.http.get<ApiResponse<Relatorio>>(`${this.api}/relatorio`, { params });
  }
}

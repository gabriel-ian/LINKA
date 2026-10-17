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
  Alocacao,
  ProfessorEdicao,
  Familia,
  FamiliaCriada,
  NovaFamilia,
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

  /** Coloca varios alunos na turma (respeita o limite de alunos). */
  matricularAlunos(
    turmaId: number,
    alunoIds: number[],
  ): Observable<ApiResponse<{ adicionados: number }>> {
    return this.http.post<ApiResponse<{ adicionados: number }>>(
      `${this.api}/turmas/${turmaId}/alunos`,
      { alunoIds },
    );
  }

  /** Tira o aluno da turma (ele fica sem turma). */
  removerDaTurma(turmaId: number, alunoId: number): Observable<unknown> {
    return this.http.delete(`${this.api}/turmas/${turmaId}/alunos/${alunoId}`);
  }

  editarAluno(id: number, dados: EdicaoAluno): Observable<unknown> {
    return this.http.patch(`${this.api}/alunos/${id}`, dados);
  }

  /** Gera senha provisoria para professor, aluno ou responsavel. */
  redefinirSenha(
    tipo: 'professores' | 'alunos' | 'responsaveis',
    id: number,
  ): Observable<ApiResponse<SenhaGerada>> {
    return this.http.post<ApiResponse<SenhaGerada>>(`${this.api}/${tipo}/${id}/senha`, {});
  }

  professores(): Observable<ApiResponse<ProfessorResumo[]>> {
    return this.http.get<ApiResponse<ProfessorResumo[]>>(`${this.api}/professores`);
  }

  /** Professor com disciplinas e turmas, para a tela de edicao. */
  professor(id: number): Observable<ApiResponse<ProfessorEdicao>> {
    return this.http.get<ApiResponse<ProfessorEdicao>>(`${this.api}/professores/${id}`);
  }

  editarProfessor(
    id: number,
    dados: { nomeCompleto: string; disciplinas: string[]; alocacoes: Alocacao[] },
  ): Observable<ApiResponse<ProfessorEdicao>> {
    return this.http.put<ApiResponse<ProfessorEdicao>>(
      `${this.api}/professores/${id}/dados`,
      dados,
    );
  }

  familias(busca?: string): Observable<ApiResponse<Familia[]>> {
    const params = busca?.trim() ? new HttpParams().set('busca', busca.trim()) : undefined;
    return this.http.get<ApiResponse<Familia[]>>(`${this.api}/familias`, { params });
  }

  criarFamilia(dados: NovaFamilia): Observable<ApiResponse<FamiliaCriada>> {
    return this.http.post<ApiResponse<FamiliaCriada>>(`${this.api}/familias`, dados);
  }

  /** Vincula ao aluno uma familia ja cadastrada (id) ou uma nova (dados). */
  vincularFamilia(
    alunoId: number,
    familia: { responsavelId: number } | { responsavel: NovaFamilia },
  ): Observable<ApiResponse<FamiliaCriada>> {
    return this.http.post<ApiResponse<FamiliaCriada>>(
      `${this.api}/alunos/${alunoId}/responsaveis`,
      familia,
    );
  }

  desvincularFamilia(alunoId: number, responsavelId: number): Observable<unknown> {
    return this.http.delete(`${this.api}/alunos/${alunoId}/responsaveis/${responsavelId}`);
  }

  criarProfessor(
    dados: NovoProfessor,
  ): Observable<ApiResponse<{ id: number; nome: string; email: string }>> {
    return this.http.post<ApiResponse<{ id: number; nome: string; email: string }>>(
      `${this.api}/professores`,
      dados,
    );
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

  relatorio(filtros: {
    mes?: string;
    turmaId?: number;
    diagnosticoId?: number;
  }): Observable<ApiResponse<Relatorio>> {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '')
        params = params.set(chave, String(valor));
    }
    return this.http.get<ApiResponse<Relatorio>>(`${this.api}/relatorio`, { params });
  }
}

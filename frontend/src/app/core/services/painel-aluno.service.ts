import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../model/escola.model';
import {
  AgendaAluno,
  AvisoAluno,
  ConquistasAluno,
  Lembrete,
  PassoConcluido,
  PreferenciasAluno,
  ProgressoAluno,
  RespostaAjuda,
  ResumoAluno,
  TarefaAluno,
  TarefaResumoAluno,
  TipoAjuda,
} from '../model/painel-aluno.model';
import { Anexo } from '../model/anexo.model';

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

  /** feitoEm: hora real de um passo feito sem internet (enviado depois). */
  concluirPasso(
    id: number,
    passo: number,
    feitoEm?: string,
  ): Observable<ApiResponse<PassoConcluido>> {
    return this.http.post<ApiResponse<PassoConcluido>>(`${this.api}/tarefas/${id}/passos`, {
      passo,
      ...(feitoEm && { feitoEm }),
    });
  }

  ajuda(id: number, tipo: TipoAjuda, passo: number): Observable<ApiResponse<RespostaAjuda>> {
    return this.http.post<ApiResponse<RespostaAjuda>>(`${this.api}/tarefas/${id}/ajuda`, {
      tipo,
      passo,
    });
  }

  /** Material da tarefa como blob (o arquivo exige o token). */
  baixarAnexo(tarefaId: number, anexoId: number): Observable<Blob> {
    return this.http.get(`${this.api}/tarefas/${tarefaId}/anexos/${anexoId}`, {
      responseType: 'blob',
    });
  }

  /** Foto ou documento da tarefa feita. */
  enviarArquivos(tarefaId: number, arquivos: File[]): Observable<ApiResponse<Anexo[]>> {
    const corpo = new FormData();
    for (const a of arquivos) corpo.append('arquivos', a, a.name);
    return this.http.post<ApiResponse<Anexo[]>>(`${this.api}/tarefas/${tarefaId}/entrega`, corpo);
  }

  removerArquivo(tarefaId: number, arquivoId: number): Observable<ApiResponse<Anexo[]>> {
    return this.http.delete<ApiResponse<Anexo[]>>(
      `${this.api}/tarefas/${tarefaId}/entrega/${arquivoId}`,
    );
  }

  baixarArquivo(tarefaId: number, arquivoId: number): Observable<Blob> {
    return this.http.get(`${this.api}/tarefas/${tarefaId}/entrega/${arquivoId}`, {
      responseType: 'blob',
    });
  }

  entregarResposta(id: number, resposta: string): Observable<ApiResponse<{ entregue: boolean }>> {
    return this.http.post<ApiResponse<{ entregue: boolean }>>(
      `${this.api}/tarefas/${id}/resposta`,
      { resposta },
    );
  }

  avisos(): Observable<ApiResponse<{ avisos: AvisoAluno[] }>> {
    return this.http.get<ApiResponse<{ avisos: AvisoAluno[] }>>(`${this.api}/avisos`);
  }

  marcarAvisoLido(id: number): Observable<ApiResponse<boolean>> {
    return this.http.post<ApiResponse<boolean>>(`${this.api}/avisos/${id}/lido`, {});
  }

  /** Todas as tarefas ja feitas (historico). */
  historico(): Observable<ApiResponse<(TarefaResumoAluno & { professor: string | null })[]>> {
    return this.http.get<ApiResponse<(TarefaResumoAluno & { professor: string | null })[]>>(
      `${this.api}/historico`,
    );
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

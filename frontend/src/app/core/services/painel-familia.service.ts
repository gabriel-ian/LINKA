import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../model/escola.model';
import {
  AvisosFamilia,
  ContextoFamilia,
  NovoIncentivo,
  PainelFamilia,
  PerfilFamilia,
  RelatorioFamilia,
  TarefaAbertaFilho,
  TarefasDoFilho,
} from '../model/painel-familia.model';

/** Rotas do perfil responsavel (/painel-familia). So os filhos do token. */
@Injectable({ providedIn: 'root' })
export class PainelFamiliaService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/painel-familia`;

  aceitarTermo(versao: string): Observable<unknown> {
    return this.http.post(`${this.api}/termo`, { versao });
  }

  /** Copia de todos os dados do filho (LGPD), em JSON. */
  dadosDoFilho(filhoId: number): Observable<ApiResponse<unknown>> {
    return this.http.get<ApiResponse<unknown>>(`${this.api}/filhos/${filhoId}/dados`);
  }

  pedirExclusao(filhoId: number): Observable<unknown> {
    return this.http.post(`${this.api}/filhos/${filhoId}/exclusao`, {});
  }

  contexto(): Observable<ApiResponse<ContextoFamilia>> {
    return this.http.get<ApiResponse<ContextoFamilia>>(`${this.api}/contexto`);
  }

  painel(filhoId: number): Observable<ApiResponse<PainelFamilia>> {
    return this.http.get<ApiResponse<PainelFamilia>>(`${this.api}/filhos/${filhoId}/painel`);
  }

  enviarIncentivo(
    filhoId: number,
    dados: NovoIncentivo,
  ): Observable<ApiResponse<{ id: number; mensagem: string; voz: boolean }>> {
    return this.http.post<ApiResponse<{ id: number; mensagem: string; voz: boolean }>>(
      `${this.api}/filhos/${filhoId}/incentivos`,
      dados,
    );
  }

  avisos(filhoId: number): Observable<ApiResponse<AvisosFamilia>> {
    return this.http.get<ApiResponse<AvisosFamilia>>(`${this.api}/filhos/${filhoId}/avisos`);
  }

  tarefas(filhoId: number): Observable<ApiResponse<TarefasDoFilho>> {
    return this.http.get<ApiResponse<TarefasDoFilho>>(`${this.api}/filhos/${filhoId}/tarefas`);
  }

  /** A tarefa como o filho ve, so para acompanhar. */
  tarefa(filhoId: number, tarefaId: number): Observable<ApiResponse<TarefaAbertaFilho>> {
    return this.http.get<ApiResponse<TarefaAbertaFilho>>(
      `${this.api}/filhos/${filhoId}/tarefas/${tarefaId}`,
    );
  }

  /** Material que a professora anexou na tarefa. */
  baixarAnexo(filhoId: number, tarefaId: number, anexoId: number): Observable<Blob> {
    return this.http.get(`${this.api}/filhos/${filhoId}/tarefas/${tarefaId}/anexos/${anexoId}`, {
      responseType: 'blob',
    });
  }

  /** Foto ou documento que o filho enviou da tarefa. */
  baixarEntrega(filhoId: number, tarefaId: number, arquivoId: number): Observable<Blob> {
    return this.http.get(`${this.api}/filhos/${filhoId}/tarefas/${tarefaId}/entrega/${arquivoId}`, {
      responseType: 'blob',
    });
  }

  marcarAvisoLido(avisoId: number): Observable<unknown> {
    return this.http.post(`${this.api}/avisos/${avisoId}/lido`, {});
  }

  relatorio(filhoId: number, mes?: string): Observable<ApiResponse<RelatorioFamilia>> {
    const params = mes ? new HttpParams().set('mes', mes) : undefined;
    return this.http.get<ApiResponse<RelatorioFamilia>>(`${this.api}/filhos/${filhoId}/relatorio`, {
      params,
    });
  }

  salvarPerfil(dados: PerfilFamilia): Observable<ApiResponse<ContextoFamilia>> {
    return this.http.patch<ApiResponse<ContextoFamilia>>(`${this.api}/perfil`, dados);
  }
}

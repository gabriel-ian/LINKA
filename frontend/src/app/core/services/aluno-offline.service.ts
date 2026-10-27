import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ResumoAluno, TarefaAluno, TarefaResumoAluno } from '../model/painel-aluno.model';
import { AuthService } from './auth.service';
import { PainelAlunoService } from './painel-aluno.service';

/** Passo feito sem internet, esperando para ir ao servidor. */
export interface PassoPendente {
  tarefaId: number;
  passo: number;
  /** Quando o aluno fez (ISO); o servidor usa essa hora. */
  feitoEm: string;
}

interface TarefaGuardada {
  tarefa: TarefaAluno;
  salvaEm: number;
}

/** Copias apagadas no "Sair" (computador da escola e compartilhado). */
export const PREFIXO_COPIA = 'linka-copia:';
/** A fila fica mesmo depois do "Sair": e trabalho do aluno ainda nao enviado. */
const PREFIXO_FILA = 'linka-fila:';
/** Depois disso a copia de uma tarefa e baixada de novo (a professora pode ter editado). */
const VALIDADE_COPIA_MS = 60 * 60 * 1000;

function ler<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Sem espaco ou armazenamento bloqueado: segue sem a copia offline.
  }
}

/**
 * Modo sem internet do aluno ("Aluno - Sem conexao" do Figma): guarda uma
 * copia do resumo e das tarefas, e uma fila dos passos feitos sem conexao,
 * enviada em ordem quando a internet volta.
 */
@Injectable({ providedIn: 'root' })
export class AlunoOfflineService {
  private auth = inject(AuthService);
  private service = inject(PainelAlunoService);

  readonly fila = signal<PassoPendente[]>([]);
  private enviando: Promise<boolean> | null = null;

  /** Le a fila do aluno logado (chamar ao abrir o painel do aluno). */
  iniciar(): void {
    this.fila.set(ler<PassoPendente[]>(this.chave(PREFIXO_FILA, 'passos')) ?? []);
  }

  private chave(prefixo: string, nome: string): string {
    return `${prefixo}${this.auth.usuarioId ?? 'anonimo'}:${nome}`;
  }

  // ---------------------------------------------------------------- copias

  guardarResumo(r: ResumoAluno): void {
    gravar(this.chave(PREFIXO_COPIA, 'resumo'), r);
  }

  lerResumo(): ResumoAluno | null {
    return ler<ResumoAluno>(this.chave(PREFIXO_COPIA, 'resumo'));
  }

  private tarefas(): Record<string, TarefaGuardada> {
    return ler<Record<string, TarefaGuardada>>(this.chave(PREFIXO_COPIA, 'tarefas')) ?? {};
  }

  guardarTarefa(t: TarefaAluno): void {
    gravar(this.chave(PREFIXO_COPIA, 'tarefas'), {
      ...this.tarefas(),
      [t.id]: { tarefa: t, salvaEm: Date.now() },
    });
  }

  lerTarefa(id: number): TarefaAluno | null {
    return this.tarefas()[id]?.tarefa ?? null;
  }

  /** A tarefa abre sem internet (os passos ja foram baixados). */
  disponivel(id: number): boolean {
    return !!this.tarefas()[id];
  }

  /** Baixa (em segundo plano) as tarefas abertas que ainda nao tem copia recente. */
  baixarParaOffline(r: ResumoAluno): void {
    const copias = this.tarefas();
    const faltam = r.tarefas
      .filter((t) => t.situacao !== 'concluida')
      .filter((t) => (copias[t.id]?.salvaEm ?? 0) < Date.now() - VALIDADE_COPIA_MS)
      .slice(0, 10);
    for (const t of faltam) {
      this.service.tarefa(t.id).subscribe({
        next: (res) => this.guardarTarefa(res.data),
        error: () => undefined,
      });
    }
  }

  // ----------------------------------------------------------------- fila

  adicionar(p: PassoPendente): void {
    this.fila.update((f) => [...f, p]);
    gravar(this.chave(PREFIXO_FILA, 'passos'), this.fila());
  }

  /** Concluida aqui, mas o ultimo passo ainda nao chegou ao servidor. */
  aguardandoEnvio(t: TarefaResumoAluno): boolean {
    return t.situacao === 'concluida' && this.fila().some((p) => p.tarefaId === t.id);
  }

  /** Mostra os passos da fila como ja feitos. */
  aplicar<T extends TarefaResumoAluno>(t: T): T {
    const pendentes = this.fila().filter((p) => p.tarefaId === t.id);
    if (!pendentes.length) return t;
    const feitos = Math.max(t.passosFeitos, ...pendentes.map((p) => p.passo));
    return {
      ...t,
      passosFeitos: feitos,
      situacao: t.situacao === 'concluida' ? 'concluida' : 'em-andamento',
    };
  }

  aplicarNoResumo(r: ResumoAluno): ResumoAluno {
    return this.fila().length ? { ...r, tarefas: r.tarefas.map((t) => this.aplicar(t)) } : r;
  }

  /**
   * Envia a fila em ordem. Devolve false se a internet caiu no meio (o que
   * faltou fica para a proxima). Chamadas ao mesmo tempo esperam a mesma.
   */
  enviar(): Promise<boolean> {
    this.enviando ??= this.enviarFila().finally(() => (this.enviando = null));
    return this.enviando;
  }

  private async enviarFila(): Promise<boolean> {
    while (this.fila().length) {
      const [p] = this.fila();
      try {
        await firstValueFrom(this.service.concluirPasso(p.tarefaId, p.passo, p.feitoEm));
      } catch (e) {
        const status = e instanceof HttpErrorResponse ? e.status : 0;
        // 400 = o servidor ja tinha esse passo (ou a tarefa saiu): descarta.
        if (status !== 400) return false;
      }
      this.fila.update((f) => f.slice(1));
      gravar(this.chave(PREFIXO_FILA, 'passos'), this.fila());
    }
    return true;
  }
}

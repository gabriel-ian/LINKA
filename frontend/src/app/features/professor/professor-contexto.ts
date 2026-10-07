import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ContextoProfessor, VisaoTurma } from '../../core/model/painel-professor.model';
import { PainelProfessorService } from '../../core/services/painel-professor.service';

const CHAVE_TURMA = 'linka.professor.turma';

/**
 * Professor logado e turma selecionada (fornecido no ProfessorLayout).
 * A turma escolhida fica guardada no navegador para a proxima visita.
 */
@Injectable()
export class ProfessorContexto {
  private service = inject(PainelProfessorService);

  readonly dados = signal<ContextoProfessor | null>(null);
  readonly turmaId = signal<number | null>(null);
  /** Visao da turma selecionada; alimenta a tela inicial e as notificacoes. */
  readonly visao = signal<VisaoTurma | null>(null);
  readonly erro = signal('');

  readonly turma = computed(() => this.dados()?.turmas.find((t) => t.id === this.turmaId()) ?? null);

  constructor() {
    this.service.contexto().subscribe({
      next: (res) => {
        this.dados.set(res.data);
        const salva = Number(lerSalva());
        const valida = res.data.turmas.find((t) => t.id === salva) ?? res.data.turmas[0];
        if (valida && this.turmaId() === null) this.turmaId.set(valida.id);
      },
      error: () => this.erro.set('Não foi possível carregar seus dados de professor.'),
    });

    effect(() => {
      const id = this.turmaId();
      if (id === null) return;
      guardar(id);
      this.recarregarVisao();
    });
  }

  selecionar(turmaId: number): void {
    if (this.dados()?.turmas.some((t) => t.id === turmaId)) this.turmaId.set(turmaId);
  }

  recarregarVisao(): void {
    const id = this.turmaId();
    if (id === null) return;
    this.service.visao(id).subscribe({ next: (res) => this.visao.set(res.data) });
  }
}

function lerSalva(): string | null {
  try {
    return localStorage.getItem(CHAVE_TURMA);
  } catch {
    return null;
  }
}

function guardar(id: number): void {
  try {
    localStorage.setItem(CHAVE_TURMA, String(id));
  } catch {
    // Sem armazenamento local: so nao lembra a turma na proxima visita.
  }
}

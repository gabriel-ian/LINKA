import { Injectable, computed, inject, signal } from '@angular/core';
import { ResumoAluno, TarefaResumoAluno } from '../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../core/services/painel-aluno.service';
import { hojeIso } from './aluno-ui';

/**
 * Aluno logado (fornecido no AlunoLayout): resumo com pontos e tarefas,
 * e a fala do mascote na barra, que cada tela troca ao abrir.
 */
@Injectable()
export class AlunoContexto {
  private service = inject(PainelAlunoService);

  readonly resumo = signal<ResumoAluno | null>(null);
  readonly erro = signal('');
  readonly fala = signal('');

  readonly pendentes = computed(
    () => this.resumo()?.tarefas.filter((t) => t.situacao !== 'concluida') ?? [],
  );

  /** Tarefas que vencem hoje (feitas ou nao) e as atrasadas ainda abertas. */
  readonly deHoje = computed<TarefaResumoAluno[]>(() => {
    const hoje = hojeIso();
    return (this.resumo()?.tarefas ?? []).filter(
      (t) =>
        t.dataEntrega === hoje ||
        (t.situacao !== 'concluida' && !!t.dataEntrega && t.dataEntrega < hoje),
    );
  });

  readonly proximas = computed(() => {
    const hoje = hojeIso();
    return this.pendentes().filter((t) => !t.dataEntrega || t.dataEntrega > hoje);
  });

  constructor() {
    this.recarregar();
  }

  recarregar(): void {
    this.service.resumo().subscribe({
      next: (res) => {
        this.resumo.set(res.data);
        this.erro.set('');
      },
      error: () => this.erro.set('Não foi possível carregar suas missões agora.'),
    });
  }
}

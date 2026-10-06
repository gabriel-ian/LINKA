import { Injectable, computed, inject, signal } from '@angular/core';
import { Escola } from '../../core/model/escola.model';
import { EscolaService } from '../../core/services/escola.service';

/**
 * Lista de escolas compartilhada pelas telas do ADM (fornecida no AdmLayout).
 * Quem altera uma escola chama recarregar() para as outras telas verem.
 */
@Injectable()
export class EscolasStore {
  private service = inject(EscolaService);

  readonly escolas = signal<Escola[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');

  readonly ativas = computed(() => this.escolas().filter((e) => e.ativo));
  readonly inativas = computed(() => this.escolas().filter((e) => !e.ativo));
  readonly pendentes = computed(() => this.escolas().filter((e) => e.ativo && e.pendente));

  constructor() {
    this.recarregar();
  }

  recarregar(): void {
    this.carregando.set(true);

    this.service.listar().subscribe({
      next: (res) => {
        this.escolas.set(res.data);
        this.erro.set('');
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar as escolas.');
        this.carregando.set(false);
      },
    });
  }
}

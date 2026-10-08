import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { TurmaResumo } from '../../../core/model/painel-escola.model';
import { EscolaContexto } from '../escola-contexto';
import { corDoIndice, percentual } from '../escola-ui';

const POR_PAGINA = 6;

/** "Escola - Turmas" do Figma. */
@Component({
  selector: 'app-escola-turmas',
  imports: [RouterLink],
  templateUrl: './turmas.html',
  styleUrl: './turmas.css',
})
export class EscolaTurmas {
  private service = inject(PainelEscolaService);
  readonly contexto = inject(EscolaContexto);

  readonly cor = corDoIndice;
  readonly pct = percentual;
  readonly ano = new Date().getFullYear();

  readonly turmas = signal<TurmaResumo[]>([]);
  readonly carregando = signal(true);
  readonly busca = signal('');
  readonly serie = signal('');
  readonly todas = signal(false);

  readonly series = computed(() => [
    ...new Set(
      this.turmas()
        .map((t) => t.serie)
        .filter((s): s is string => !!s),
    ),
  ]);

  readonly filtradas = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    return this.turmas().filter(
      (t) =>
        (!this.serie() || t.serie === this.serie()) &&
        (!termo ||
          [t.nome, t.codigo, t.serie ?? '', ...t.professores.map((p) => p.nome)].some((c) =>
            c.toLowerCase().includes(termo),
          )),
    );
  });

  readonly visiveis = computed(() =>
    this.todas() ? this.filtradas() : this.filtradas().slice(0, POR_PAGINA),
  );

  constructor() {
    this.service.turmas().subscribe({
      next: (res) => {
        this.turmas.set(res.data);
        this.carregando.set(false);
      },
      error: () => this.carregando.set(false),
    });
  }
}

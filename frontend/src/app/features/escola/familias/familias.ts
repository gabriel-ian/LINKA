import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, startWith, switchMap } from 'rxjs';
import { Familia, SenhaGerada } from '../../../core/model/painel-escola.model';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { SenhaProvisoria } from '../../../shared/senha/senha-provisoria';
import { iniciaisPessoa } from '../escola-ui';

const POR_PAGINA = 10;

/** Familias da escola: busca, filhos de cada uma e atalho para cadastrar outro filho. */
@Component({
  selector: 'app-escola-familias',
  imports: [RouterLink, SenhaProvisoria],
  templateUrl: './familias.html',
  styleUrl: './familias.css',
})
export class EscolaFamilias {
  private service = inject(PainelEscolaService);
  readonly iniciais = iniciaisPessoa;

  readonly familias = signal<Familia[] | null>(null);
  readonly erro = signal('');
  readonly senha = signal<(SenhaGerada & { nome: string }) | null>(null);
  readonly pagina = signal(0);
  private readonly busca = new Subject<string>();

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil((this.familias()?.length ?? 0) / POR_PAGINA)),
  );
  readonly visiveis = computed(() =>
    (this.familias() ?? []).slice(this.pagina() * POR_PAGINA, (this.pagina() + 1) * POR_PAGINA),
  );

  constructor() {
    this.busca
      .pipe(
        startWith(''),
        debounceTime(250),
        switchMap((t) => this.service.familias(t)),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (res) => {
          this.familias.set(res.data);
          this.pagina.set(0);
        },
        error: () => this.erro.set('Não foi possível carregar as famílias agora.'),
      });
  }

  buscar(termo: string): void {
    this.busca.next(termo);
  }

  proximaPagina(): void {
    this.pagina.update((p) => (p + 1 < this.totalPaginas() ? p + 1 : 0));
  }

  novaSenha(f: Familia): void {
    if (
      !confirm(`Gerar uma nova senha de acesso para ${f.nome}? A senha atual deixa de funcionar.`)
    )
      return;
    this.service.redefinirSenha('responsaveis', f.id).subscribe({
      next: (res) => this.senha.set({ ...res.data, nome: f.nome }),
      error: () => this.erro.set('Não foi possível gerar a nova senha.'),
    });
  }
}

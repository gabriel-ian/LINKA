import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EscolasStore } from '../escolas.store';
import { ROTULO_PLANO, ROTULO_STATUS, statusEscola } from '../escola-ui';

type Filtro = 'todas' | 'ativas' | 'inativas';

const POR_PAGINA = 6;

/** "ADM - Listar escolas" do Figma. */
@Component({
  selector: 'app-escolas-lista',
  imports: [RouterLink],
  templateUrl: './escolas-lista.html',
  styleUrl: './escolas-lista.css',
})
export class EscolasLista {
  readonly store = inject(EscolasStore);

  readonly status = statusEscola;
  readonly rotuloStatus = ROTULO_STATUS;
  readonly rotuloPlano = ROTULO_PLANO;

  readonly filtro = signal<Filtro>('todas');
  readonly cidade = signal('');
  readonly pagina = signal(0);

  readonly cidades = computed(() =>
    [
      ...new Set(
        this.store
          .escolas()
          .map((e) => e.cidade)
          .filter((c): c is string => !!c),
      ),
    ].sort(),
  );

  readonly filtradas = computed(() =>
    this.store
      .escolas()
      .filter(
        (e) =>
          (this.filtro() === 'todas' || e.ativo === (this.filtro() === 'ativas')) &&
          (!this.cidade() || e.cidade === this.cidade()),
      ),
  );

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtradas().length / POR_PAGINA)),
  );

  readonly visiveis = computed(() =>
    this.filtradas().slice(this.pagina() * POR_PAGINA, (this.pagina() + 1) * POR_PAGINA),
  );

  readonly mostrando = computed(() => this.pagina() * POR_PAGINA + this.visiveis().length);

  filtrar(filtro: Filtro): void {
    this.filtro.set(filtro);
    this.pagina.set(0);
  }

  escolherCidade(cidade: string): void {
    this.cidade.set(cidade);
    this.pagina.set(0);
  }

  proximaPagina(): void {
    this.pagina.update((p) => (p + 1 < this.totalPaginas() ? p + 1 : 0));
  }
}

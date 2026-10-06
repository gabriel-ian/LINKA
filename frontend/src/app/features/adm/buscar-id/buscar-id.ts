import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EscolaService } from '../../../core/services/escola.service';
import { Escola } from '../../../core/model/escola.model';
import {
  ROTULO_PLANO,
  ROTULO_STATUS,
  cidadeUf,
  dataBr,
  iniciais,
  statusEscola,
} from '../escola-ui';

/** "ADM - Buscar por ID" do Figma. O ID fica na URL (?id=) para poder ser linkado. */
@Component({
  selector: 'app-buscar-id',
  imports: [FormsModule, RouterLink],
  templateUrl: './buscar-id.html',
  styleUrl: './buscar-id.css',
})
export class BuscarId {
  private service = inject(EscolaService);
  private router = inject(Router);

  readonly iniciais = iniciais;
  readonly status = statusEscola;
  readonly rotuloStatus = ROTULO_STATUS;
  readonly rotuloPlano = ROTULO_PLANO;
  readonly cidadeUf = cidadeUf;
  readonly dataBr = dataBr;

  idDigitado = '';
  readonly escola = signal<Escola | null>(null);
  readonly erro = signal('');
  readonly carregando = signal(false);

  constructor() {
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((params) => {
        const id = params.get('id');
        this.idDigitado = id ?? '';
        if (id) this.carregar(Number(id));
        else this.escola.set(null);
      });
  }

  buscar(): void {
    const id = this.idDigitado.trim().replace(/^#/, '');

    if (!/^\d+$/.test(id)) {
      this.erro.set('Digite um ID numérico, por exemplo 1042.');
      this.escola.set(null);
      return;
    }

    this.router.navigate([], { queryParams: { id } });
  }

  private carregar(id: number): void {
    this.erro.set('');
    this.carregando.set(true);

    this.service.buscarPorId(id).subscribe({
      next: (res) => {
        this.escola.set(res.data);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.escola.set(null);
        this.carregando.set(false);
        this.erro.set(
          e.status === 404
            ? `Nenhuma escola com o ID #${id}.`
            : 'Não foi possível buscar a escola agora.',
        );
      },
    });
  }

  professores(e: Escola): string {
    return e.limiteProfessores != null
      ? `${e.totalProfessores} de ${e.limiteProfessores} cadastrados`
      : `${e.totalProfessores} cadastrados`;
  }
}

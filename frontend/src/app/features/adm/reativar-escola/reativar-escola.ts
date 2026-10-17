import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EscolaService } from '../../../core/services/escola.service';
import { Escola } from '../../../core/model/escola.model';
import { EscolasStore } from '../escolas.store';
import { AdmResultado } from '../resultado/resultado';
import { dataBr } from '../escola-ui';

/** "ADM - Reativar escola" do Figma: lista das inativas com botao por linha. */
@Component({
  selector: 'app-reativar-escola',
  imports: [RouterLink, AdmResultado],
  templateUrl: './reativar-escola.html',
  styleUrl: './reativar-escola.css',
})
export class ReativarEscola {
  private service = inject(EscolaService);
  readonly store = inject(EscolasStore);

  readonly dataBr = dataBr;

  readonly reativando = signal<number | null>(null);
  readonly reativada = signal<Escola | null>(null);
  readonly erro = signal('');

  reativar(escola: Escola): void {
    this.reativando.set(escola.id);
    this.erro.set('');

    this.service.ativar(escola.id).subscribe({
      next: () => {
        this.reativando.set(null);
        this.reativada.set(escola);
        this.store.recarregar();
      },
      error: () => {
        this.reativando.set(null);
        this.erro.set(`Não foi possível reativar a ${escola.nome} agora.`);
      },
    });
  }
}

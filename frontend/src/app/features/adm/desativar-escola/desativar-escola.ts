import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EscolaService } from '../../../core/services/escola.service';
import {
  Escola,
  MOTIVOS_DESATIVACAO,
  MotivoDesativacao,
} from '../../../core/model/escola.model';
import { EscolasStore } from '../escolas.store';
import { AdmResultado } from '../resultado/resultado';
import { EscolherEscola } from '../escolher-escola/escolher-escola';
import { ROTULO_STATUS, cidadeUf, hojeIso, iniciais, statusEscola } from '../escola-ui';

/** "ADM - Desativar escola" do Figma. */
@Component({
  selector: 'app-desativar-escola',
  imports: [FormsModule, RouterLink, AdmResultado, EscolherEscola],
  templateUrl: './desativar-escola.html',
  styleUrl: './desativar-escola.css',
})
export class DesativarEscola {
  private service = inject(EscolaService);
  private router = inject(Router);
  readonly store = inject(EscolasStore);

  readonly motivos = MOTIVOS_DESATIVACAO;
  readonly iniciais = iniciais;
  readonly status = statusEscola;
  readonly rotuloStatus = ROTULO_STATUS;
  readonly cidadeUf = cidadeUf;

  motivo: MotivoDesativacao = 'Fim do contrato';
  data = hojeIso();
  observacao = '';
  confirmado = false;

  readonly escola = signal<Escola | null>(null);
  readonly semId = signal(false);
  readonly erro = signal('');
  readonly enviando = signal(false);
  readonly concluido = signal(false);

  constructor() {
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((params) => {
        const id = params.get('id');
        this.concluido.set(false);
        this.confirmado = false;
        this.semId.set(!id);
        if (id) this.carregar(Number(id));
      });
  }

  private carregar(id: number): void {
    this.erro.set('');
    this.service.buscarPorId(id).subscribe({
      next: (res) => this.escola.set(res.data),
      error: (e: HttpErrorResponse) =>
        this.erro.set(e.status === 404 ? `Nenhuma escola com o ID #${id}.` : 'Não foi possível carregar a escola.'),
    });
  }

  desativar(): void {
    const escola = this.escola();
    if (!escola || !this.confirmado || !this.data) return;

    this.enviando.set(true);
    this.erro.set('');

    this.service
      .desativar(escola.id, {
        motivo: this.motivo,
        data: this.data,
        observacao: this.observacao.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);
          this.concluido.set(true);
          this.store.recarregar();
        },
        error: (e: HttpErrorResponse) => {
          this.enviando.set(false);
          this.erro.set(
            [e.error?.message].flat().join(' ') || 'Não foi possível desativar a escola agora.',
          );
        },
      });
  }

  cancelar(): void {
    const escola = this.escola();
    this.router.navigate(['/adm/escolas/id'], { queryParams: escola ? { id: escola.id } : {} });
  }
}

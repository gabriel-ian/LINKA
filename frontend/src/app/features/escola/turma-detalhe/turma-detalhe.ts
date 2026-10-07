import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { TurmaDetalhe } from '../../../core/model/painel-escola.model';
import {
  ROTULO_SITUACAO,
  corDaSituacao,
  corDoIndice,
  iniciaisPessoa,
  juntar,
  percentual,
} from '../escola-ui';

/** "Escola - Detalhe da turma" e "Escola - Turma sem alunos" do Figma. */
@Component({
  selector: 'app-escola-turma-detalhe',
  imports: [RouterLink],
  templateUrl: './turma-detalhe.html',
  styleUrl: './turma-detalhe.css',
})
export class EscolaTurmaDetalhe {
  private service = inject(PainelEscolaService);

  readonly pct = percentual;
  readonly iniciais = iniciaisPessoa;
  readonly cor = corDoIndice;
  readonly corSituacao = corDaSituacao;
  readonly rotuloSituacao = ROTULO_SITUACAO;
  readonly juntar = juntar;

  readonly turma = signal<TurmaDetalhe | null>(null);
  readonly criada = signal(false);
  readonly erro = signal('');

  constructor() {
    const rota = inject(ActivatedRoute);
    rota.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((p) => {
      this.criada.set(rota.snapshot.queryParamMap.get('criada') === '1');
      this.service.turma(Number(p.get('id'))).subscribe({
        next: (res) => this.turma.set(res.data),
        error: (e: HttpErrorResponse) =>
          this.erro.set(e.status === 404 ? 'Turma não encontrada.' : 'Não foi possível carregar a turma.'),
      });
    });
  }

  nomesProfessores(t: TurmaDetalhe): string {
    return t.professores.length ? juntar(t.professores.map((p) => p.nome)) : 'sem professores vinculados';
  }
}

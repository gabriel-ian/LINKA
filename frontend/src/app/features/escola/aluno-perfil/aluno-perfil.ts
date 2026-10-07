import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { AlunoDetalhe } from '../../../core/model/painel-escola.model';
import { dataBr } from '../../adm/escola-ui';
import {
  ROTULO_SITUACAO,
  corDaSituacao,
  corDoIndice,
  iniciaisPessoa,
  juntar,
  percentual,
} from '../escola-ui';

/** "Escola - Perfil do aluno" do Figma. */
@Component({
  selector: 'app-escola-aluno-perfil',
  imports: [RouterLink],
  templateUrl: './aluno-perfil.html',
  styleUrl: './aluno-perfil.css',
})
export class EscolaAlunoPerfil {
  private service = inject(PainelEscolaService);

  readonly pct = percentual;
  readonly iniciais = iniciaisPessoa;
  readonly cor = corDoIndice;
  readonly corSituacao = corDaSituacao;
  readonly rotuloSituacao = ROTULO_SITUACAO;
  readonly juntar = juntar;
  readonly dataBr = dataBr;

  readonly aluno = signal<AlunoDetalhe | null>(null);
  readonly erro = signal('');
  readonly baixando = signal(false);

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((p) =>
        this.service.aluno(Number(p.get('id'))).subscribe({
          next: (res) => this.aluno.set(res.data),
          error: (e: HttpErrorResponse) =>
            this.erro.set(e.status === 404 ? 'Aluno não encontrado.' : 'Não foi possível carregar o aluno.'),
        }),
      );
  }

  subtitulo(a: AlunoDetalhe): string {
    return [
      a.turma?.nome,
      a.diagnosticos.length ? a.diagnosticos.join(', ') : 'Diagnóstico não informado',
      a.idade !== null ? `${a.idade} anos` : null,
      a.cgm ? `CGM ${a.cgm}` : null,
    ]
      .filter(Boolean)
      .join(' - ');
  }

  /** O laudo exige o token: baixa como blob e abre o download pelo navegador. */
  baixarLaudo(a: AlunoDetalhe): void {
    this.baixando.set(true);
    this.service.baixarLaudo(a.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `laudo-${a.nome.toLowerCase().replace(/\s+/g, '-')}`;
        link.click();
        URL.revokeObjectURL(url);
        this.baixando.set(false);
      },
      error: () => {
        this.baixando.set(false);
        this.erro.set('Não foi possível baixar o laudo.');
      },
    });
  }
}

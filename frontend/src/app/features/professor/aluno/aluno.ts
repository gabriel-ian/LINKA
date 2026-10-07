import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelProfessorService } from '../../../core/services/painel-professor.service';
import { AlunoProfessor } from '../../../core/model/painel-professor.model';
import {
  corDaSituacao,
  corDoIndice,
  iniciaisPessoa,
  juntar,
  percentual,
} from '../../escola/escola-ui';
import { situacaoDe } from './situacao';

/** "Professor - Perfil do aluno" do Figma. */
@Component({
  selector: 'app-professor-aluno',
  templateUrl: './aluno.html',
  styleUrl: './aluno.css',
})
export class ProfessorAluno {
  private service = inject(PainelProfessorService);
  private location = inject(Location);

  readonly pct = percentual;
  readonly iniciais = iniciaisPessoa;
  readonly cor = corDoIndice;
  readonly corSituacao = corDaSituacao;
  readonly situacao = situacaoDe;
  readonly juntar = juntar;

  readonly aluno = signal<AlunoProfessor | null>(null);
  readonly erro = signal('');

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((p) =>
        this.service.aluno(Number(p.get('id'))).subscribe({
          next: (res) => this.aluno.set(res.data),
          error: (e: HttpErrorResponse) =>
            this.erro.set(e.status === 404 ? 'Aluno não encontrado nas suas turmas.' : 'Não foi possível carregar o aluno.'),
        }),
      );
  }

  voltar(): void {
    this.location.back();
  }

  subtitulo(a: AlunoProfessor): string {
    return [a.turma.nome, a.diagnosticos.length ? a.diagnosticos.join(', ') : null, a.idade !== null ? `${a.idade} anos` : null]
      .filter(Boolean)
      .join(' - ');
  }
}

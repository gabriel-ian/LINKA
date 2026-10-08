import { Component, DestroyRef, inject, signal } from '@angular/core';
import { PerfilAprendizagemForm } from '../../../shared/perfil-aprendizagem/perfil-aprendizagem';
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
  imports: [PerfilAprendizagemForm],
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
  readonly editando = signal(false);
  readonly salvando = signal(false);
  readonly erroEdicao = signal('');
  readonly dificuldades = signal('');
  readonly pontosFortes = signal('');
  readonly interesses = signal<string[]>([]);

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((p) =>
        this.service.aluno(Number(p.get('id'))).subscribe({
          next: (res) => this.aluno.set(res.data),
          error: (e: HttpErrorResponse) =>
            this.erro.set(
              e.status === 404
                ? 'Aluno não encontrado nas suas turmas.'
                : 'Não foi possível carregar o aluno.',
            ),
        }),
      );
  }

  editar(a: AlunoProfessor): void {
    this.dificuldades.set(a.dificuldades ?? '');
    this.pontosFortes.set(a.pontosFortes ?? '');
    this.interesses.set([...a.interesses]);
    this.erroEdicao.set('');
    this.editando.set(true);
  }

  salvar(a: AlunoProfessor): void {
    this.salvando.set(true);
    this.service
      .editarPerfilAluno(a.id, {
        dificuldades: this.dificuldades().trim() || null,
        pontosFortes: this.pontosFortes().trim() || null,
        interesses: this.interesses(),
      })
      .subscribe({
        next: (res) => {
          this.salvando.set(false);
          this.editando.set(false);
          this.aluno.set(res.data);
        },
        error: () => {
          this.salvando.set(false);
          this.erroEdicao.set('Não foi possível salvar o perfil.');
        },
      });
  }

  voltar(): void {
    this.location.back();
  }

  subtitulo(a: AlunoProfessor): string {
    return [
      a.turma.nome,
      a.diagnosticos.length ? a.diagnosticos.join(', ') : null,
      a.idade !== null ? `${a.idade} anos` : null,
    ]
      .filter(Boolean)
      .join(' - ');
  }
}

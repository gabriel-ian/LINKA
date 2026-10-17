import { Component, effect, inject, signal } from '@angular/core';
import { PainelProfessorService } from '../../../core/services/painel-professor.service';
import { RelatorioProfessor } from '../../../core/model/painel-professor.model';
import { ProfessorContexto } from '../professor-contexto';
import { corDaSituacao, juntar, mesAtual, nomeMes, percentual } from '../../escola/escola-ui';
import { situacaoDe } from '../aluno/situacao';

/** "Professor - Relatorios" do Figma. */
@Component({
  selector: 'app-professor-relatorios',
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css',
})
export class ProfessorRelatorios {
  private service = inject(PainelProfessorService);
  readonly contexto = inject(ProfessorContexto);

  readonly pct = percentual;
  readonly nomeMes = nomeMes;
  readonly corSituacao = corDaSituacao;
  readonly situacao = situacaoDe;

  readonly meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  readonly turmaId = signal<number | null>(null);
  readonly mes = signal(mesAtual());
  readonly alunos = signal<'todos' | 'nee'>('todos');
  readonly relatorio = signal<RelatorioProfessor | null>(null);
  readonly erro = signal('');

  constructor() {
    effect(() => {
      if (this.turmaId() === null && this.contexto.turmaId() !== null)
        this.turmaId.set(this.contexto.turmaId());
    });

    effect(() => {
      const turma = this.turmaId();
      if (turma === null) return;
      this.erro.set('');
      this.service.relatorio(turma, this.mes(), this.alunos()).subscribe({
        next: (res) => this.relatorio.set(res.data),
        error: () => this.erro.set('Não foi possível carregar o relatório.'),
      });
    });
  }

  /** Semana em destaque no grafico: a atual no mes corrente, senao a ultima. */
  semanaDestaque(total: number): number {
    if (this.mes() !== mesAtual()) return total - 1;
    return Math.min(Math.floor((new Date().getDate() - 1) / 7), total - 1);
  }

  disciplinas(): string {
    return juntar(this.contexto.dados()?.disciplinas.map((d) => d.nome) ?? []);
  }

  variacao(v: number | null): string {
    if (v === null) return 'sem comparação semanal';
    return `${v > 0 ? '+' : ''}${v}% na semana`;
  }

  exportar(): void {
    window.print();
  }
}

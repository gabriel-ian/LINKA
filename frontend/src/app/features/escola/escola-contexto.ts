import { Injectable, inject, signal } from '@angular/core';
import { Escola } from '../../core/model/escola.model';
import { AlunoResumo, ProfessorResumo } from '../../core/model/painel-escola.model';
import { EscolaService } from '../../core/services/escola.service';
import { PainelEscolaService } from '../../core/services/painel-escola.service';

/**
 * Dados que a moldura do painel usa (nome da escola, notificacoes).
 * Fornecido no EscolaLayout; telas que cadastram chamam recarregar().
 */
@Injectable()
export class EscolaContexto {
  private escolas = inject(EscolaService);
  private painel = inject(PainelEscolaService);

  readonly escola = signal<Escola | null>(null);
  readonly professores = signal<ProfessorResumo[]>([]);
  readonly alunos = signal<AlunoResumo[]>([]);

  constructor() {
    this.escolas.minhaEscola().subscribe({ next: (res) => this.escola.set(res.data) });
    this.recarregar();
  }

  recarregar(): void {
    this.painel.professores().subscribe({ next: (res) => this.professores.set(res.data) });
    this.painel.alunos().subscribe({ next: (res) => this.alunos.set(res.data) });
  }
}

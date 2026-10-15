import { Component, computed, inject, signal } from '@angular/core';
import { ProgressoAluno } from '../../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { AlunoContexto } from '../aluno-contexto';

const CORES_MATERIA = ['c-verde', 'c-azul', 'c-laranja', 'c-roxo'];

/** "Aluno - Progresso" do Figma. */
@Component({
  selector: 'app-aluno-progresso',
  templateUrl: './progresso.html',
  styleUrl: './progresso.css',
})
export class AlunoProgresso {
  private contexto = inject(AlunoContexto);
  readonly dados = signal<ProgressoAluno | null>(null);
  readonly erro = signal('');

  readonly maiorSemana = computed(() =>
    Math.max(1, ...(this.dados()?.porSemana.map((s) => s.concluidas) ?? [1])),
  );

  constructor() {
    inject(PainelAlunoService)
      .progresso()
      .subscribe({
        next: (res) => {
          this.dados.set(res.data);
          const seq = res.data.sequencia.atual;
          this.contexto.fala.set(
            seq > 1
              ? `Você está numa sequência de ${seq} dias! Continue assim.`
              : 'Olha só quanto você já avançou!',
          );
        },
        error: () => this.erro.set('Não foi possível carregar seu progresso agora.'),
      });
  }

  corMateria(i: number): string {
    return CORES_MATERIA[i % CORES_MATERIA.length];
  }
}

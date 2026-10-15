import { Component, computed, inject, signal } from '@angular/core';
import { ConquistasAluno } from '../../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { AlunoContexto } from '../aluno-contexto';
import { COR_BLOQUEADA, MEDALHAS } from '../aluno-ui';

/** "Aluno - Conquistas" do Figma. */
@Component({
  selector: 'app-aluno-conquistas',
  templateUrl: './conquistas.html',
  styleUrl: './conquistas.css',
})
export class AlunoConquistas {
  private contexto = inject(AlunoContexto);
  readonly dados = signal<ConquistasAluno | null>(null);
  readonly erro = signal('');
  readonly medalhas = MEDALHAS;
  readonly corBloqueada = COR_BLOQUEADA;

  /** % da barra ate o proximo nivel. */
  readonly pctNivel = computed(() => {
    const d = this.dados();
    if (!d) return 0;
    return d.nivel.proximo ? Math.min(100, (d.pontos.total / d.nivel.proximo) * 100) : 100;
  });

  constructor() {
    inject(PainelAlunoService)
      .conquistas()
      .subscribe({
        next: (res) => {
          this.dados.set(res.data);
          const quase = res.data.conquistas.some(
            (c) => !c.desbloqueada && c.meta > 1 && c.atual / c.meta >= 0.5,
          );
          this.contexto.fala.set(
            quase
              ? 'Falta pouco para a próxima conquista!'
              : 'Cada missão te deixa mais perto de uma conquista!',
          );
        },
        error: () => this.erro.set('Não foi possível carregar suas conquistas agora.'),
      });
  }
}

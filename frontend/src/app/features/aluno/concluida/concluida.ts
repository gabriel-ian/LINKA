import { Component, computed, inject, signal } from '@angular/core';
import { VozService } from '../../../core/services/voz.service';
import { MascoteDesenho } from '../../../shared/mascote/mascote';
import { Router, RouterLink } from '@angular/router';
import { PassoConcluido } from '../../../core/model/painel-aluno.model';
import { AdmResultado } from '../../adm/resultado/resultado';
import { AlunoContexto } from '../aluno-contexto';
import { COR_BLOQUEADA, MEDALHAS } from '../aluno-ui';

/** "Aluno - Tarefa concluída" (Missão cumprida!) do Figma. */
@Component({
  selector: 'app-aluno-concluida',
  imports: [RouterLink, AdmResultado, MascoteDesenho],
  templateUrl: './concluida.html',
  styleUrl: './concluida.css',
})
export class AlunoConcluida {
  readonly contexto = inject(AlunoContexto);
  private voz = inject(VozService);

  /** Vem da tela da tarefa; se a pagina for recarregada, usa o resumo. */
  readonly resultado = signal<PassoConcluido | null>(null);
  readonly titulo = signal('');
  readonly medalhas = MEDALHAS;
  readonly corBloqueada = COR_BLOQUEADA;

  readonly pontosTotal = computed(
    () => this.resultado()?.pontos?.total ?? this.contexto.resumo()?.pontos.total ?? 0,
  );
  readonly sequencia = computed(
    () => this.resultado()?.sequencia?.atual ?? this.contexto.resumo()?.sequencia.atual ?? 0,
  );

  constructor() {
    const estado = inject(Router).getCurrentNavigation()?.extras.state as
      { resultado?: PassoConcluido; titulo?: string } | undefined;
    this.resultado.set(estado?.resultado ?? null);
    this.titulo.set(estado?.titulo ?? '');

    const nome = this.contexto.resumo()?.aluno.primeiroNome;
    this.contexto.fala.set(nome ? `Uhul! Você conseguiu, ${nome}!` : 'Uhul! Você conseguiu!');
    // O mascote comemora em voz alta (se o aluno usa a leitura em voz alta).
    if (this.contexto.resumo()?.preferencias.ouvirVoz !== false)
      setTimeout(() => this.comemorar(), 400);
  }

  /** "Parabéns, Miguel! Você terminou a tarefa!" */
  readonly frase = computed(() => {
    const nome = this.contexto.resumo()?.aluno.primeiroNome;
    return `Parabéns${nome ? ', ' + nome : ''}! Você terminou a tarefa!`;
  });

  comemorar(): void {
    this.voz.falar(`${this.frase()} Que orgulho de você!`);
  }
}

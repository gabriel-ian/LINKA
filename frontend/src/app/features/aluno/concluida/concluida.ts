import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PassoConcluido } from '../../../core/model/painel-aluno.model';
import { AdmResultado } from '../../adm/resultado/resultado';
import { AlunoContexto } from '../aluno-contexto';
import { COR_BLOQUEADA, MEDALHAS } from '../aluno-ui';
import { EntregaArquivos } from '../entrega-arquivos';

/** "Aluno - Tarefa concluída" (Missão cumprida!) do Figma. */
@Component({
  selector: 'app-aluno-concluida',
  imports: [RouterLink, AdmResultado, EntregaArquivos],
  templateUrl: './concluida.html',
  styleUrl: './concluida.css',
})
export class AlunoConcluida {
  readonly contexto = inject(AlunoContexto);

  /** Vem da tela da tarefa; se a pagina for recarregada, usa o resumo. */
  readonly resultado = signal<PassoConcluido | null>(null);
  readonly titulo = signal('');
  /** Antes de sair, o aluno pode mandar a foto ou o documento da tarefa. */
  readonly tarefaId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
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
  }
}

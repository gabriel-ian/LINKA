import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TarefaResumoAluno } from '../../../core/model/painel-aluno.model';
import { VozService } from '../../../core/services/voz.service';
import { AlunoContexto } from '../aluno-contexto';
import { ItemTarefa } from '../item-tarefa';
import { AdmResultado } from '../../adm/resultado/resultado';
import { dataLonga, hojeIso, horaCurta, prazo, tituloCompleto } from '../aluno-ui';

/** "Aluno - Tarefas" e "Aluno - Tarefas (tudo feito hoje)" do Figma. */
@Component({
  selector: 'app-aluno-tarefas',
  imports: [RouterLink, ItemTarefa, AdmResultado],
  templateUrl: './tarefas.html',
  styleUrl: './tarefas.css',
})
export class AlunoTarefas {
  readonly contexto = inject(AlunoContexto);
  readonly voz = inject(VozService);
  readonly hoje = dataLonga();
  readonly prazo = prazo;
  readonly titulo = tituloCompleto;

  readonly abertasHoje = computed(() =>
    this.contexto.deHoje().filter((t) => t.situacao !== 'concluida'),
  );
  /** Uma de cada vez: so a primeira missao aberta ganha os botoes grandes. */
  readonly atual = computed(() => this.abertasHoje()[0] ?? null);
  readonly fezAlgoHoje = computed(() =>
    this.contexto.deHoje().some((t) => t.situacao === 'concluida'),
  );

  constructor() {
    effect(() => {
      if (!this.contexto.resumo()) return;
      this.contexto.fala.set(
        this.atual()
          ? 'Aqui estão suas missões! Vamos com calma - uma de cada vez.'
          : this.fezAlgoHoje()
            ? 'Você fez todas as missões de hoje!'
            : 'Hoje não tem missão. Aproveite para descansar!',
      );
    });
  }

  ouvir(t: TarefaResumoAluno): void {
    const atrasada = t.dataEntrega && t.dataEntrega < hojeIso();
    const quando = atrasada
      ? 'Ela está atrasada.'
      : t.horaLimite
        ? `Vence hoje às ${horaCurta(t.horaLimite).replace('h', ' horas ')}.`
        : 'É para hoje.';
    const andamento =
      t.situacao === 'em-andamento'
        ? ` Você já fez ${t.passosFeitos} de ${t.totalPassos} passos.`
        : '';
    this.voz.falar(`${tituloCompleto(t)}. ${quando}${andamento}`);
  }

  animar(): void {
    const t = this.atual();
    this.voz.falar(
      t
        ? `Vamos começar! A missão agora é ${tituloCompleto(t)}. É só apertar em ver passos.`
        : 'Você está indo muito bem!',
    );
  }
}

import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { RouterLink } from '@angular/router';
import { TarefaResumoAluno } from '../../../core/model/painel-aluno.model';
import { VozService } from '../../../core/services/voz.service';
import { AlunoContexto } from '../aluno-contexto';
import { ItemTarefa } from '../item-tarefa';
import { MascoteDesenho } from '../../../shared/mascote/mascote';
import { AdmResultado } from '../../adm/resultado/resultado';
import { dataLonga, hojeIso, horaCurta, tituloCompleto } from '../aluno-ui';

/** "Aluno - Tarefas" e "Aluno - Tarefas (tudo feito hoje)" do Figma. */
@Component({
  selector: 'app-aluno-tarefas',
  imports: [RouterLink, ItemTarefa, AdmResultado, DatePipe, MascoteDesenho],
  templateUrl: './tarefas.html',
  styleUrl: './tarefas.css',
})
export class AlunoTarefas {
  readonly contexto = inject(AlunoContexto);
  readonly voz = inject(VozService);
  readonly hoje = dataLonga();
  readonly titulo = tituloCompleto;

  /** Historico das tarefas feitas (nao somem depois de concluidas). */
  readonly feitas = signal<TarefaResumoAluno[]>([]);
  readonly mostrarTodas = signal(false);
  /** Tarefa feita com a resposta da professora aberta na lista. */
  readonly recadoAberto = signal<number | null>(null);
  readonly feitasVisiveis = computed(() =>
    this.mostrarTodas() ? this.feitas() : this.feitas().slice(0, 8),
  );

  readonly abertasHoje = computed(() =>
    this.contexto.deHoje().filter((t) => t.situacao !== 'concluida'),
  );
  /** Uma de cada vez: so a primeira missao aberta ganha os botoes grandes. */
  readonly atual = computed(() => this.abertasHoje()[0] ?? null);
  readonly fezAlgoHoje = computed(() =>
    this.contexto.deHoje().some((t) => t.situacao === 'concluida'),
  );

  constructor() {
    inject(PainelAlunoService)
      .historico()
      .subscribe({ next: (res) => this.feitas.set(res.data) });

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

  alternarRecado(t: TarefaResumoAluno): void {
    const abrir = this.recadoAberto() !== t.id;
    this.recadoAberto.set(abrir ? t.id : null);
    if (abrir) this.ouvirRecado(t);
  }

  ouvirRecado(t: TarefaResumoAluno): void {
    if (t.comentario) this.voz.falar(`A professora disse: ${t.comentario}`);
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

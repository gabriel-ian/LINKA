import { Component, computed, effect, inject } from '@angular/core';
import { IncentivoAluno } from '../../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { VozService } from '../../../core/services/voz.service';
import { RouterLink } from '@angular/router';
import { AlunoContexto } from '../aluno-contexto';
import { ItemTarefa } from '../item-tarefa';
import { dataLonga, hojeIso, horaCurta, plural, tituloCompleto } from '../aluno-ui';

/** "Aluno - Início" do Figma. */
@Component({
  selector: 'app-aluno-inicio',
  imports: [RouterLink, ItemTarefa],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class AlunoInicio {
  readonly contexto = inject(AlunoContexto);
  readonly voz = inject(VozService);
  private service = inject(PainelAlunoService);
  /** Incentivos que o Dino ja leu sozinho nesta visita. */
  private lidosEmVoz = new Set<number>();
  readonly hoje = dataLonga();
  readonly titulo = tituloCompleto;

  /** Ate 3 tarefas: as de hoje primeiro, depois as proximas. */
  readonly lista = computed(() =>
    [...this.contexto.deHoje(), ...this.contexto.proximas()].slice(0, 3),
  );

  readonly abertasHoje = computed(() =>
    this.contexto.deHoje().filter((t) => t.situacao !== 'concluida'),
  );

  /** A missao mais urgente: atrasada ou de hoje, a de prazo mais cedo. */
  readonly urgente = computed(() => this.abertasHoje()[0] ?? null);

  readonly avisoUrgente = computed(() => {
    const t = this.urgente();
    if (!t) return '';
    const quando =
      t.dataEntrega && t.dataEntrega < hojeIso()
        ? ' está atrasada.'
        : ` vence hoje${t.horaLimite ? ' às ' + horaCurta(t.horaLimite) : ''}.`;
    const andamento =
      t.situacao === 'em-andamento'
        ? ` Você já fez ${t.passosFeitos} de ${t.totalPassos} passos.`
        : ' Ainda não começou.';
    return quando + andamento;
  });

  /** Recado mais novo da familia (some quando o aluno agradece). */
  readonly incentivo = computed(() => this.contexto.resumo()?.incentivos[0] ?? null);

  recado(i: IncentivoAluno): string {
    return `${i.de} mandou um recado: ${i.mensagem}`;
  }

  /** "Obrigado!": marca como visto e tira da tela. */
  agradecer(i: IncentivoAluno): void {
    this.service.marcarIncentivoLido(i.id).subscribe();
    this.contexto.resumo.update((r) =>
      r ? { ...r, incentivos: r.incentivos.filter((x) => x.id !== i.id) } : r,
    );
  }

  constructor() {
    // Com "voz do Dino", o mascote le o recado assim que a tela abre.
    effect(() => {
      const i = this.incentivo();
      if (!i || !i.voz || this.lidosEmVoz.has(i.id)) return;
      this.lidosEmVoz.add(i.id);
      this.voz.falar(this.recado(i));
    });

    effect(() => {
      const r = this.contexto.resumo();
      if (!r) return;
      const i = this.incentivo();
      if (i) {
        this.contexto.fala.set(this.recado(i));
        return;
      }
      const n = this.abertasHoje().length;
      this.contexto.fala.set(
        n
          ? `Oi ${r.aluno.primeiroNome}! Você tem ${plural(n, 'missão', 'missões')} hoje. Quer começar pela mais fácil?`
          : `Oi ${r.aluno.primeiroNome}! Nenhuma missão para hoje. Que tal ver suas conquistas?`,
      );
    });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AcaoVirada, PreviaVirada, ResultadoVirada } from '../../../core/model/painel-escola.model';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { EscolaContexto } from '../escola-contexto';
import { DialogoService } from '../../../core/services/dialogo.service';
import { Esqueleto } from '../../../shared/esqueleto/esqueleto';

type TurmaPrevia = PreviaVirada['turmas'][number];

/**
 * Virada do ano letivo: cada turma vai para a serie seguinte no novo ano;
 * a escola marca quem repete ou sai da turma, confere e confirma.
 */
@Component({
  selector: 'app-escola-virada',
  imports: [Esqueleto, FormsModule, RouterLink],
  templateUrl: './virada.html',
  styleUrl: './virada.css',
})
export class EscolaVirada {
  private dialogo = inject(DialogoService);
  private service = inject(PainelEscolaService);
  private contexto = inject(EscolaContexto);

  readonly previa = signal<PreviaVirada | null>(null);
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly salvando = signal(false);
  readonly resultado = signal<ResultadoVirada | null>(null);
  /** So o que a escola mudou em relacao ao padrao de cada turma. */
  readonly decisoes = signal(new Map<number, AcaoVirada>());
  readonly abertas = signal(new Set<number>());
  copiarProfessores = true;

  readonly resumo = computed(() => {
    const total = { promover: 0, reter: 0, sair: 0 };
    for (const t of this.previa()?.turmas ?? [])
      for (const a of t.alunos) total[this.acao(a.id, t)]++;
    return total;
  });

  constructor() {
    this.service.previaVirada().subscribe({
      next: (res) => {
        this.previa.set(res.data);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar as turmas agora.');
      },
    });
  }

  acao(alunoId: number, t: TurmaPrevia): AcaoVirada {
    return this.decisoes().get(alunoId) ?? t.acaoPadrao;
  }

  definir(alunoId: number, t: TurmaPrevia, acao: AcaoVirada): void {
    const novo = new Map(this.decisoes());
    if (acao === t.acaoPadrao) novo.delete(alunoId);
    else novo.set(alunoId, acao);
    this.decisoes.set(novo);
  }

  /** Aplica a mesma decisao a todos os alunos da turma. */
  definirTurma(t: TurmaPrevia, acao: AcaoVirada): void {
    for (const a of t.alunos) this.definir(a.id, t, acao);
  }

  alternar(id: number): void {
    const novo = new Set(this.abertas());
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    this.abertas.set(novo);
  }

  /** "28 vão para o 7º Ano A, 2 repetem" — o resumo de cada turma. */
  resumoTurma(t: TurmaPrevia): string {
    const n = { promover: 0, reter: 0, sair: 0 };
    for (const a of t.alunos) n[this.acao(a.id, t)]++;
    const partes = [
      n.promover && `${n.promover} para o ${t.destino?.nome}`,
      n.reter && `${n.reter} ${n.reter === 1 ? 'repete' : 'repetem'}`,
      n.sair && `${n.sair} sem turma`,
    ].filter(Boolean);
    return t.alunos.length ? partes.join(' · ') : 'Sem alunos';
  }

  rotuloRepete(t: TurmaPrevia): string {
    return `Repete o ${[t.serie, t.letra].filter(Boolean).join(' ')}`;
  }

  async confirmar(): Promise<void> {
    const p = this.previa();
    if (!p || this.salvando()) return;
    const r = this.resumo();
    const sim = await this.dialogo.confirmar({
      titulo: `Fazer a virada para ${p.anoDestino}?`,
      mensagem:
        `${r.promover} sobem de série, ${r.reter} ${r.reter === 1 ? 'repete' : 'repetem'} e ` +
        `${r.sair} ficam sem turma. As turmas de ${p.anoOrigem} ficam encerradas (só para ` +
        'consulta). Não dá para desfazer.',
      confirmar: 'Fazer a virada',
      perigo: true,
    });
    if (!sim) return;

    this.salvando.set(true);
    this.erro.set('');
    this.service
      .fazerVirada({
        anoOrigem: p.anoOrigem,
        copiarProfessores: this.copiarProfessores,
        decisoes: [...this.decisoes()].map(([alunoId, acao]) => ({ alunoId, acao })),
      })
      .subscribe({
        next: (res) => {
          this.salvando.set(false);
          this.resultado.set(res.data);
          // Alunos e turmas mudaram: o resto do painel recarrega.
          this.contexto.recarregar();
        },
        error: (e: HttpErrorResponse) => {
          this.salvando.set(false);
          this.erro.set(mensagemDeErro(e, 'Não foi possível fazer a virada agora.'));
        },
      });
  }
}

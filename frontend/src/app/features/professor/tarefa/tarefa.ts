import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelProfessorService } from '../../../core/services/painel-professor.service';
import { TarefaProfessor } from '../../../core/model/painel-professor.model';
import { ProfessorContexto } from '../professor-contexto';
import { hojeIso } from '../../adm/escola-ui';
import { dataCurta, primeiroNome } from '../professor-ui';

/** "Professor - Tarefa criada" do Figma: original x versao adaptada por aluno. */
@Component({
  selector: 'app-professor-tarefa',
  imports: [FormsModule, RouterLink],
  templateUrl: './tarefa.html',
  styleUrl: './tarefa.css',
})
export class ProfessorTarefa {
  private service = inject(PainelProfessorService);
  private contexto = inject(ProfessorContexto);

  readonly primeiroNome = primeiroNome;

  readonly tarefa = signal<TarefaProfessor | null>(null);
  readonly nova = signal(false);
  readonly selecionado = signal<number | null>(null);
  readonly gerando = signal(false);
  readonly erroIa = signal('');
  readonly erro = signal('');
  readonly editando = signal(false);
  readonly salvando = signal(false);
  textoEdicao = '';

  readonly adaptacao = computed(() => {
    const t = this.tarefa();
    return t?.adaptacoes.find((a) => a.alunoId === this.selecionado()) ?? t?.adaptacoes[0] ?? null;
  });

  readonly geradas = computed(
    () => this.tarefa()?.adaptacoes.filter((a) => a.passos?.length).length ?? 0,
  );

  readonly prazo = computed(() => {
    const t = this.tarefa();
    if (!t?.dataEntrega) return 'sem prazo';
    const dia = t.dataEntrega === hojeIso() ? 'hoje' : `em ${dataCurta(t.dataEntrega)}`;
    return `entrega ${dia}${t.horaLimite ? ' às ' + Number(t.horaLimite.slice(0, 2)) + 'h' + (t.horaLimite.endsWith('00') ? '' : t.horaLimite.slice(3)) : ''}`;
  });

  constructor() {
    const rota = inject(ActivatedRoute);
    rota.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((p) => {
      this.nova.set(rota.snapshot.queryParamMap.get('nova') === '1');
      this.carregar(Number(p.get('id')));
    });
  }

  private carregar(id: number): void {
    this.service.tarefa(id).subscribe({
      next: (res) => {
        this.aplicar(res.data);
        const faltam = res.data.adaptacoes.some((a) => !a.passos?.length);
        // Recem-criada: ja pede as versoes adaptadas para a IA.
        if (this.nova() && faltam && res.data.iaDisponivel) this.gerar();
      },
      error: (e: HttpErrorResponse) =>
        this.erro.set(
          e.status === 404 ? 'Tarefa não encontrada.' : 'Não foi possível carregar a tarefa.',
        ),
    });
  }

  private aplicar(t: TarefaProfessor): void {
    this.tarefa.set(t);
    if (this.selecionado() === null && t.adaptacoes.length)
      this.selecionado.set(t.adaptacoes[0].alunoId);
  }

  gerar(alunoId?: number): void {
    const t = this.tarefa();
    if (!t) return;
    this.gerando.set(true);
    this.erroIa.set('');
    this.service.adaptar(t.id, alunoId).subscribe({
      next: (res) => {
        this.gerando.set(false);
        this.aplicar(res.data);
        this.contexto.recarregarVisao();
      },
      error: (e: HttpErrorResponse) => {
        this.gerando.set(false);
        this.erroIa.set(
          `${[e.error?.message].flat().join(' ') || 'A IA não respondeu.'} Você pode escrever os passos manualmente em "Editar adaptação".`,
        );
      },
    });
  }

  escolher(alunoId: number): void {
    this.selecionado.set(alunoId);
    this.editando.set(false);
  }

  editar(): void {
    this.textoEdicao = (this.adaptacao()?.passos ?? []).join('\n');
    this.editando.set(true);
  }

  salvarEdicao(): void {
    const t = this.tarefa();
    const a = this.adaptacao();
    const passos = this.textoEdicao
      .split('\n')
      .map((p) => p.replace(/^\s*\d+[.)-]\s*/, '').trim())
      .filter(Boolean);
    if (!t || !a || !passos.length) return;

    this.salvando.set(true);
    this.service.editarAdaptacao(t.id, a.alunoId, passos).subscribe({
      next: (res) => {
        this.salvando.set(false);
        this.editando.set(false);
        this.aplicar(res.data);
      },
      error: () => {
        this.salvando.set(false);
        this.erroIa.set('Não foi possível salvar a adaptação.');
      },
    });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PainelProfessorService } from '../../../core/services/painel-professor.service';
import { TarefaListada } from '../../../core/model/painel-professor.model';
import { ProfessorContexto } from '../professor-contexto';
import { COR_STATUS, rotuloStatus } from '../professor-ui';

type Filtro = 'todas' | 'abertas' | 'encerradas';
const POR_PAGINA = 8;

/** Lista de todas as tarefas do professor (tela nova, no estilo do Figma). */
@Component({
  selector: 'app-professor-tarefas',
  imports: [RouterLink],
  templateUrl: './tarefas.html',
  styleUrl: './tarefas.css',
})
export class ProfessorTarefas {
  private service = inject(PainelProfessorService);
  readonly contexto = inject(ProfessorContexto);

  readonly corStatus = COR_STATUS;
  readonly rotuloStatus = rotuloStatus;

  readonly tarefas = signal<TarefaListada[]>([]);
  readonly carregando = signal(true);
  readonly erro = signal('');
  readonly turmaId = signal<number | null>(null);
  readonly filtro = signal<Filtro>('todas');
  readonly busca = signal('');
  readonly pagina = signal(0);

  /** Abertas = ainda dentro do prazo (hoje, amanha ou futuras) e nao concluidas. */
  private aberta = (t: TarefaListada) =>
    t.status === 'hoje' || t.status === 'amanha' || t.status === 'futura';

  readonly daTurma = computed(() =>
    this.tarefas().filter((t) => this.turmaId() === null || t.turmaId === this.turmaId()),
  );

  readonly contagem = computed(() => ({
    todas: this.daTurma().length,
    abertas: this.daTurma().filter(this.aberta).length,
    encerradas: this.daTurma().filter((t) => !this.aberta(t)).length,
  }));

  readonly filtradas = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    return this.daTurma().filter(
      (t) =>
        (this.filtro() === 'todas' || (this.filtro() === 'abertas') === this.aberta(t)) &&
        (!termo || [t.titulo, t.disciplina ?? ''].some((c) => c.toLowerCase().includes(termo))),
    );
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtradas().length / POR_PAGINA)),
  );
  readonly visiveis = computed(() =>
    this.filtradas().slice(this.pagina() * POR_PAGINA, (this.pagina() + 1) * POR_PAGINA),
  );

  constructor() {
    this.service.tarefas().subscribe({
      next: (res) => {
        this.tarefas.set(res.data);
        this.carregando.set(false);
      },
      error: () => {
        this.carregando.set(false);
        this.erro.set('Não foi possível carregar as tarefas.');
      },
    });
  }

  filtrar(f: Filtro): void {
    this.filtro.set(f);
    this.pagina.set(0);
  }

  escolherTurma(valor: string): void {
    this.turmaId.set(valor ? Number(valor) : null);
    this.pagina.set(0);
  }

  proximaPagina(): void {
    this.pagina.update((p) => (p + 1 < this.totalPaginas() ? p + 1 : 0));
  }

  pctEntregas(t: TarefaListada): number {
    return t.total ? Math.round((t.entregues / t.total) * 100) : 0;
  }
}

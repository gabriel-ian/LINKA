import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelProfessorService } from '../../../core/services/painel-professor.service';
import { AlunosTurma } from '../../../core/model/painel-professor.model';
import { ProfessorContexto } from '../professor-contexto';
import { corDaSituacao, iniciaisPessoa, juntar, percentual } from '../../escola/escola-ui';
import { quandoRelativo } from '../professor-ui';

type Filtro = 'todos' | 'nee' | 'atraso';
const POR_PAGINA = 7;

/** "Professor - Turma" do Figma. */
@Component({
  selector: 'app-professor-turma',
  imports: [RouterLink],
  templateUrl: './turma.html',
  styleUrl: './turma.css',
})
export class ProfessorTurma {
  private service = inject(PainelProfessorService);
  private contexto = inject(ProfessorContexto);

  readonly pct = percentual;
  readonly iniciais = iniciaisPessoa;
  readonly corSituacao = corDaSituacao;
  readonly quando = quandoRelativo;
  readonly juntar = juntar;

  readonly dados = signal<AlunosTurma | null>(null);
  readonly erro = signal('');
  readonly filtro = signal<Filtro>('todos');
  readonly busca = signal('');
  readonly pagina = signal(0);

  readonly contagem = computed(() => {
    const alunos = this.dados()?.alunos ?? [];
    return {
      todos: alunos.length,
      nee: alunos.filter((a) => a.neurodivergente).length,
      atraso: alunos.filter((a) => a.atrasadas > 0).length,
    };
  });

  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    return (
      (this.dados()?.alunos ?? [])
        .filter(
          (a) =>
            (this.filtro() === 'todos' ||
              (this.filtro() === 'nee' ? a.neurodivergente : a.atrasadas > 0)) &&
            (!termo || a.nome.toLowerCase().includes(termo)),
        )
        // Quem precisa de atencao primeiro, como no Figma.
        .sort(
          (a, b) => b.atrasadas - a.atrasadas || (a.entregasMes ?? 101) - (b.entregasMes ?? 101),
        )
    );
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtrados().length / POR_PAGINA)),
  );
  readonly visiveis = computed(() =>
    this.filtrados().slice(this.pagina() * POR_PAGINA, (this.pagina() + 1) * POR_PAGINA),
  );

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((p) => {
        const id = Number(p.get('id'));
        this.contexto.selecionar(id);
        this.pagina.set(0);
        this.service.alunos(id).subscribe({
          next: (res) => this.dados.set(res.data),
          error: (e: HttpErrorResponse) =>
            this.erro.set(
              e.status === 404
                ? 'Esta turma não está entre as suas.'
                : 'Não foi possível carregar a turma.',
            ),
        });
      });
  }

  filtrar(f: Filtro): void {
    this.filtro.set(f);
    this.pagina.set(0);
  }

  proximaPagina(): void {
    this.pagina.update((p) => (p + 1 < this.totalPaginas() ? p + 1 : 0));
  }

  disciplinas(d: AlunosTurma): string {
    return juntar(d.turma.disciplinas.map((x) => x.nome));
  }
}

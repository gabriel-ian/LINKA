import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EscolaContexto } from '../escola-contexto';
import { ROTULO_SITUACAO, corDaSituacao, iniciaisPessoa, percentual } from '../escola-ui';

const POR_PAGINA = 6;
const DESTAQUES = ['TDAH', 'TEA', 'Dislexia'];

/** "Escola - Alunos NEE" do Figma. */
@Component({
  selector: 'app-escola-alunos',
  imports: [RouterLink],
  templateUrl: './alunos.html',
  styleUrl: './alunos.css',
})
export class EscolaAlunos {
  readonly contexto = inject(EscolaContexto);

  readonly iniciais = iniciaisPessoa;
  readonly pct = percentual;
  readonly corSituacao = corDaSituacao;
  readonly rotuloSituacao = ROTULO_SITUACAO;
  readonly destaques = DESTAQUES;
  readonly coresDestaque = ['azul', 'verde', 'laranja'];

  readonly busca = signal('');
  readonly turma = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('turma') ?? '');
  readonly diagnostico = signal('');
  readonly pagina = signal(0);

  readonly alunosNee = computed(() => this.contexto.alunos().filter((a) => a.neurodivergente));

  readonly turmas = computed(() => {
    const mapa = new Map<number, string>();
    for (const a of this.alunosNee()) if (a.turma) mapa.set(a.turma.id, a.turma.nome);
    return [...mapa].map(([id, nome]) => ({ id, nome }));
  });

  readonly diagnosticos = computed(() => [...new Set(this.alunosNee().flatMap((a) => a.diagnosticos))].sort());

  /** Contagem por diagnostico; "Outros" soma tudo fora de TDAH/TEA/Dislexia. */
  readonly porDiagnostico = computed(() => {
    const contar = (nome: string) => this.alunosNee().filter((a) => a.diagnosticos.includes(nome)).length;
    const outros = this.alunosNee().filter(
      (a) => a.diagnosticos.length === 0 || a.diagnosticos.some((d) => !DESTAQUES.includes(d)),
    );
    const nomesOutros = [...new Set(outros.flatMap((a) => a.diagnosticos).filter((d) => !DESTAQUES.includes(d)))];

    return {
      destaques: DESTAQUES.map(contar),
      outros: outros.length,
      nomesOutros: nomesOutros.length ? nomesOutros.join(', ').toLowerCase() : 'não informado',
    };
  });

  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    return this.alunosNee().filter(
      (a) =>
        (!this.turma() || String(a.turma?.id) === this.turma()) &&
        (!this.diagnostico() || a.diagnosticos.includes(this.diagnostico())) &&
        (!termo || a.nome.toLowerCase().includes(termo) || (a.cgm ?? '').includes(termo)),
    );
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / POR_PAGINA)));
  readonly visiveis = computed(() =>
    this.filtrados().slice(this.pagina() * POR_PAGINA, (this.pagina() + 1) * POR_PAGINA),
  );

  proximaPagina(): void {
    this.pagina.update((p) => (p + 1 < this.totalPaginas() ? p + 1 : 0));
  }
}

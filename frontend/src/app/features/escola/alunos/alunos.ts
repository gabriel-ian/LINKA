import { PluralPipe } from '../../../shared/plural.pipe';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EscolaContexto } from '../escola-contexto';
import { ROTULO_SITUACAO, corDaSituacao, iniciaisPessoa, percentual } from '../escola-ui';

const POR_PAGINA = 6;
const DESTAQUES = ['TDAH', 'TEA', 'Dislexia'];

/** "Escola - Alunos NEE" do Figma, agora com todos os alunos (filtro NEE). */
@Component({
  selector: 'app-escola-alunos',
  imports: [RouterLink, PluralPipe],
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
  /** Voltou do perfil depois de apagar os dados de um aluno (LGPD). */
  readonly apagado = inject(ActivatedRoute).snapshot.queryParamMap.has('apagado');
  readonly turma = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('turma') ?? '');
  readonly diagnostico = signal('');
  /** '' = todos, 'nee' = com NEE, 'sem' = sem NEE. */
  readonly grupo = signal<'' | 'nee' | 'sem'>('');
  readonly pagina = signal(0);

  readonly alunosNee = computed(() => this.contexto.alunos().filter((a) => a.neurodivergente));

  readonly semTurma = computed(() => this.contexto.alunos().filter((a) => !a.turma).length);

  readonly turmas = computed(() => {
    const mapa = new Map<number, string>();
    for (const a of this.contexto.alunos()) if (a.turma) mapa.set(a.turma.id, a.turma.nome);
    return [...mapa]
      .map(([id, nome]) => ({ id, nome }))
      .sort((x, y) => x.nome.localeCompare(y.nome));
  });

  readonly diagnosticos = computed(() =>
    [...new Set(this.alunosNee().flatMap((a) => a.diagnosticos))].sort(),
  );

  /** Contagem por diagnostico; "Outros" soma tudo fora de TDAH/TEA/Dislexia. */
  readonly porDiagnostico = computed(() => {
    const contar = (nome: string) =>
      this.alunosNee().filter((a) => a.diagnosticos.includes(nome)).length;
    const outros = this.alunosNee().filter(
      (a) => a.diagnosticos.length === 0 || a.diagnosticos.some((d) => !DESTAQUES.includes(d)),
    );
    const nomesOutros = [
      ...new Set(outros.flatMap((a) => a.diagnosticos).filter((d) => !DESTAQUES.includes(d))),
    ];

    return {
      destaques: DESTAQUES.map(contar),
      outros: outros.length,
      nomesOutros: nomesOutros.length ? nomesOutros.join(', ').toLowerCase() : 'não informado',
    };
  });

  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    return this.contexto
      .alunos()
      .filter(
        (a) =>
          (!this.grupo() || a.neurodivergente === (this.grupo() === 'nee')) &&
          (!this.turma() ||
            (this.turma() === 'sem' ? !a.turma : String(a.turma?.id) === this.turma())) &&
          (!this.diagnostico() || a.diagnosticos.includes(this.diagnostico())) &&
          (!termo || a.nome.toLowerCase().includes(termo) || (a.cgm ?? '').includes(termo)),
      );
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtrados().length / POR_PAGINA)),
  );
  readonly visiveis = computed(() =>
    this.filtrados().slice(this.pagina() * POR_PAGINA, (this.pagina() + 1) * POR_PAGINA),
  );

  proximaPagina(): void {
    this.pagina.update((p) => (p + 1 < this.totalPaginas() ? p + 1 : 0));
  }
}

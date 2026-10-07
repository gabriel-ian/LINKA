import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { TurmaResumo } from '../../../core/model/painel-escola.model';
import { EscolaContexto } from '../escola-contexto';
import { corDoIndice, iniciaisPessoa, mesAtual, nomeMes, percentual } from '../escola-ui';

/** "Escola - Painel" do Figma. */
@Component({
  selector: 'app-escola-painel',
  imports: [RouterLink],
  templateUrl: './painel.html',
  styleUrl: './painel.css',
})
export class EscolaPainel {
  private service = inject(PainelEscolaService);
  readonly contexto = inject(EscolaContexto);

  readonly cor = corDoIndice;
  readonly iniciais = iniciaisPessoa;
  readonly pct = percentual;
  readonly mes = nomeMes(mesAtual());
  readonly ano = new Date().getFullYear();

  readonly turmas = signal<TurmaResumo[]>([]);
  readonly taxa = signal<number | null>(null);

  readonly alunosNee = computed(() => this.contexto.alunos().filter((a) => a.neurodivergente));
  readonly professoresAtivos = computed(
    () => this.contexto.professores().filter((p) => p.status === 'ativo').length,
  );
  readonly atencao = computed(() =>
    this.alunosNee()
      .filter((a) => a.situacao === 'atencao')
      .slice(0, 3),
  );

  constructor() {
    this.service.turmas().subscribe({ next: (res) => this.turmas.set(res.data) });
    this.service.relatorio({}).subscribe({ next: (res) => this.taxa.set(res.data.taxaConclusao) });
  }
}

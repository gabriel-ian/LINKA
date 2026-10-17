import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EscolasStore } from '../escolas.store';
import { ROTULO_STATUS, cidadeUf, dataBr, iniciais, statusEscola } from '../escola-ui';

/** "ADM - Visao geral" do Figma. Numeros calculados da lista de escolas. */
@Component({
  selector: 'app-visao-geral',
  imports: [RouterLink],
  templateUrl: './visao-geral.html',
  styleUrl: './visao-geral.css',
})
export class VisaoGeral {
  readonly store = inject(EscolasStore);

  readonly iniciais = iniciais;
  readonly status = statusEscola;
  readonly rotuloStatus = ROTULO_STATUS;
  readonly cidadeUf = cidadeUf;
  readonly dataBr = dataBr;

  readonly mesAtual = new Date()
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(/^./, (c) => c.toUpperCase())
    .replace(' de ', ' ');

  readonly totais = computed(() => {
    const escolas = this.store.escolas();
    const ativas = this.store.ativas();

    return {
      cadastradas: escolas.length,
      ativas: ativas.length,
      inativas: escolas.length - ativas.length,
      alunosNee: ativas.reduce((s, e) => s + e.totalAlunosNee, 0),
      professores: ativas.reduce((s, e) => s + e.totalProfessores, 0),
    };
  });

  readonly recentes = computed(() =>
    [...this.store.escolas()].sort((a, b) => b.criado_em.localeCompare(a.criado_em)).slice(0, 4),
  );

  /** Pendentes primeiro, depois as desativadas mais recentes. */
  readonly atencao = computed(() => [
    ...this.store.pendentes().map((e) => ({
      cor: 'laranja',
      titulo: 'Cadastro pendente',
      texto: `${e.nome} aguarda o primeiro acesso da coordenação.`,
    })),
    ...[...this.store.inativas()]
      .sort((a, b) => (b.desativadaEm ?? '').localeCompare(a.desativadaEm ?? ''))
      .slice(0, 2)
      .map((e) => ({
        cor: 'cinza',
        titulo: 'Escola desativada',
        texto: e.desativadaEm
          ? `${e.nome} foi desativada em ${dataBr(e.desativadaEm).slice(0, 5)}.`
          : `${e.nome} está desativada.`,
      })),
  ]);
}

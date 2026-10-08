import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfessorContexto } from '../professor-contexto';
import { corDaSituacao, iniciaisPessoa, juntar, percentual } from '../../escola/escola-ui';
import { COR_STATUS, hojePorExtenso, nomeCurto, rotuloStatus } from '../professor-ui';

/** "Professor - Visao geral" do Figma. */
@Component({
  selector: 'app-professor-visao',
  imports: [RouterLink],
  templateUrl: './visao.html',
  styleUrl: './visao.css',
})
export class ProfessorVisao {
  readonly contexto = inject(ProfessorContexto);

  readonly pct = percentual;
  readonly iniciais = iniciaisPessoa;
  readonly corSituacao = corDaSituacao;
  readonly corStatus = COR_STATUS;
  readonly rotuloStatus = rotuloStatus;
  readonly hoje = hojePorExtenso();

  readonly saudacao = computed(() => {
    const nome = this.contexto.dados()?.nome;
    return nome ? `Olá, ${nomeCurto(nome)}` : 'Olá';
  });

  /** Nomes NEE com atraso, para o aviso do topo (como no Figma). */
  readonly destaqueAtraso = computed(() => {
    const visao = this.contexto.visao();
    if (!visao) return '';
    const nee = visao.alunosComAtraso.filter((a) => a.neurodivergente).map((a) => a.nome);
    if (!nee.length) return '';
    const nomes = juntar(nee.slice(0, 2));
    return nee.length === 1
      ? `${nomes} precisa de atenção especial hoje.`
      : `${nomes} precisam de atenção especial hoje.`;
  });

  constructor() {
    this.contexto.recarregarVisao();
  }
}

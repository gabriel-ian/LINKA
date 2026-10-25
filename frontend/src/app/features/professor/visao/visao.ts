import { PluralPipe } from '../../../shared/plural.pipe';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { horaCurta } from '../../aluno/aluno-ui';
import { ProfessorContexto } from '../professor-contexto';
import { corDaSituacao, iniciaisPessoa, juntar, percentual } from '../../escola/escola-ui';
import { COR_STATUS, hojePorExtenso, nomeCurto, rotuloStatus } from '../professor-ui';

/** "Professor - Visao geral" do Figma. */
@Component({
  selector: 'app-professor-visao',
  imports: [RouterLink, PluralPipe],
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

  /**
   * "O que precisa da sua atencao hoje": pedidos de ajuda, tarefas que vencem
   * hoje e alunos NEE que precisam de atencao. Cada item leva para onde agir.
   */
  readonly hojeItens = computed(() => {
    const v = this.contexto.visao();
    if (!v) return [];
    const itens: {
      tipo: 'ajuda' | 'prazo' | 'atencao';
      texto: string;
      link: unknown[];
      acao: string;
      query?: Record<string, string>;
    }[] = [];
    for (const p of v.pedidosAjuda.slice(0, 3))
      itens.push({
        tipo: 'ajuda',
        texto: `${nomeCurto(p.aluno)} pediu ajuda${p.passo ? ' no passo ' + p.passo : ''} em "${p.tarefa}"`,
        link: ['/professor/tarefas', p.tarefaId],
        acao: 'Ver tarefa',
      });
    for (const t of v.tarefasRecentes.filter((x) => x.status === 'hoje'))
      itens.push({
        tipo: 'prazo',
        texto: `"${t.titulo}" vence hoje${t.horaLimite ? ' às ' + horaCurta(t.horaLimite) : ''}: ${t.entregues} de ${t.total} entregaram`,
        link: ['/professor/tarefas', t.id],
        acao: 'Ver entregas',
      });
    const atencao = v.alunosNee.filter((a) => a.situacao === 'atencao');
    if (atencao.length)
      itens.push({
        tipo: 'atencao',
        texto: `${atencao.length === 1 ? '1 aluno NEE precisa' : atencao.length + ' alunos NEE precisam'} de atenção: ${juntar(atencao.slice(0, 3).map((a) => nomeCurto(a.nome)))}${atencao.length > 3 ? ' e outros' : ''}`,
        link: ['/professor/turmas', v.turma.id],
        acao: 'Ver turma',
      });
    return itens;
  });

  constructor() {
    this.contexto.recarregarVisao();
  }
}

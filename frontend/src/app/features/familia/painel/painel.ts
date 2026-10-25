import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TarefaResumoAluno } from '../../../core/model/painel-aluno.model';
import { ItemTarefa } from '../../aluno/item-tarefa';
import { dataLonga, hojeIso, horaCurta } from '../../aluno/aluno-ui';
import { FamiliaContexto } from '../familia-contexto';
import { corMateria } from '../familia-ui';

const PONTO = { verde: 'ponto-verde', laranja: 'ponto-laranja', cinza: 'ponto-cinza' } as const;

/** "Familia - Painel" do Figma: a rotina do filho escolhido. */
@Component({
  selector: 'app-familia-painel',
  imports: [RouterLink, ItemTarefa],
  templateUrl: './painel.html',
  styleUrls: ['../familia-comum.css', './painel.css'],
})
export class FamiliaPainel {
  readonly contexto = inject(FamiliaContexto);
  readonly hoje = dataLonga();
  readonly cor = corMateria;
  readonly ponto = PONTO;

  /** O que e de hoje primeiro, depois as atrasadas e o que vem; ate 3. */
  readonly lista = computed(() => {
    const hoje = hojeIso();
    const grupo = (t: TarefaResumoAluno) =>
      t.dataEntrega === hoje ? 0 : t.dataEntrega && t.dataEntrega < hoje ? 1 : 2;
    return [...(this.contexto.painel()?.tarefas ?? [])]
      .sort((a, b) => grupo(a) - grupo(b))
      .slice(0, 3);
  });

  /** "Theo fez 2 de 3 tarefas hoje. Falta Matematica, ate 18h." */
  readonly fraseHoje = computed(() => {
    const p = this.contexto.painel();
    if (!p) return '';
    const nome = p.filho.primeiroNome;
    const dia = hojeIso();
    const deHoje = p.tarefas.filter((t) => t.dataEntrega === dia);
    if (!deHoje.length) return `${nome} não tem tarefas para hoje.`;
    const feitas = deHoje.filter((t) => t.situacao === 'concluida').length;
    if (feitas === deHoje.length)
      return deHoje.length === 1
        ? `${nome} já fez a tarefa de hoje!`
        : `${nome} já fez todas as ${deHoje.length} tarefas de hoje!`;
    const faltam = deHoje
      .filter((t) => t.situacao !== 'concluida')
      .map(
        (t) =>
          `${t.disciplina ?? t.titulo}${t.horaLimite ? ', até ' + horaCurta(t.horaLimite) : ''}`,
      );
    return `${nome} fez ${feitas} de ${deHoje.length} ${deHoje.length === 1 ? 'tarefa' : 'tarefas'} hoje. ${faltam.length === 1 ? 'Falta' : 'Faltam'} ${faltam.join('; ')}.`;
  });

  readonly concluiuHoje = computed(() => /já fez/.test(this.fraseHoje()));

  readonly prazoAlerta = computed(() => {
    const t = this.contexto.painel()?.alerta;
    if (!t) return '';
    return t.dataEntrega === hojeIso() && t.horaLimite
      ? `hoje às ${horaCurta(t.horaLimite)}`
      : 'hoje';
  });
}

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

  readonly prazoAlerta = computed(() => {
    const t = this.contexto.painel()?.alerta;
    if (!t) return '';
    return t.dataEntrega === hojeIso() && t.horaLimite
      ? `hoje às ${horaCurta(t.horaLimite)}`
      : 'hoje';
  });
}

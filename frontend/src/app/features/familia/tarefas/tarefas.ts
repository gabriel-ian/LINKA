import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TarefaDoFilho, TarefasDoFilho } from '../../../core/model/painel-familia.model';
import { PainelFamiliaService } from '../../../core/services/painel-familia.service';
import { ItemTarefa } from '../../aluno/item-tarefa';
import { FamiliaContexto } from '../familia-contexto';

type Aba = 'aFazer' | 'atrasadas' | 'feitas';

/** Todas as tarefas do filho: a fazer, atrasadas e feitas (com a entrega). */
@Component({
  selector: 'app-familia-tarefas',
  imports: [RouterLink, DatePipe, ItemTarefa],
  templateUrl: './tarefas.html',
  styleUrls: ['../familia-comum.css', './tarefas.css'],
})
export class FamiliaTarefas {
  readonly contexto = inject(FamiliaContexto);
  private service = inject(PainelFamiliaService);

  readonly dados = signal<TarefasDoFilho | null>(null);
  readonly erro = signal('');
  /** Aba aberta no celular (no computador as tres colunas aparecem juntas). */
  readonly aba = signal<Aba>('aFazer');

  readonly grupos = computed(() => {
    const d = this.dados();
    if (!d) return [];
    return [
      {
        chave: 'atrasadas' as const,
        titulo: 'ATRASADAS',
        itens: d.atrasadas,
        vazio: 'Nada atrasado. Muito bem!',
      },
      {
        chave: 'aFazer' as const,
        titulo: 'A FAZER',
        itens: d.aFazer,
        vazio: 'Nenhuma tarefa pendente.',
      },
      {
        chave: 'feitas' as const,
        titulo: 'FEITAS',
        itens: d.feitas,
        vazio: 'Nenhuma tarefa feita ainda.',
      },
    ];
  });

  constructor() {
    effect(() => {
      const id = this.contexto.filhoId();
      if (id === null) return;
      this.dados.set(null);
      this.service.tarefas(id).subscribe({
        next: (res) => {
          this.dados.set(res.data);
          this.erro.set('');
          if (!res.data.aFazer.length && res.data.atrasadas.length) this.aba.set('atrasadas');
        },
        error: () => this.erro.set('Não foi possível carregar as tarefas agora.'),
      });
    });
  }

  detalhe(t: TarefaDoFilho): string {
    const partes: string[] = [];
    if (t.professor) partes.push(`Prof. ${t.professor.split(' ')[0]}`);
    if (t.situacao === 'em-andamento') partes.push(`${t.passosFeitos} de ${t.totalPassos} passos`);
    return partes.join(' · ');
  }
}

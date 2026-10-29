import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  TarefaAbertaFilho,
  TarefaDoFilho,
  TarefasDoFilho,
} from '../../../core/model/painel-familia.model';
import { PainelFamiliaService } from '../../../core/services/painel-familia.service';
import { ItemTarefa } from '../../aluno/item-tarefa';
import { FamiliaContexto } from '../familia-contexto';
import { Esqueleto } from '../../../shared/esqueleto/esqueleto';
import { AnexosLista } from '../../../shared/anexos/anexos-lista';
import { Anexo } from '../../../core/model/anexo.model';

type Aba = 'aFazer' | 'atrasadas' | 'feitas';

/** Todas as tarefas do filho: a fazer, atrasadas e feitas (com a entrega). */
@Component({
  selector: 'app-familia-tarefas',
  imports: [Esqueleto, RouterLink, DatePipe, ItemTarefa, AnexosLista],
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
  /** Tarefa com os arquivos abertos. */
  readonly arquivosAbertos = signal<number | null>(null);
  /** Tarefa aberta so para ver (enunciado, passos e materiais). */
  readonly aberta = signal<TarefaAbertaFilho | null>(null);
  readonly carregandoTarefa = signal<number | null>(null);
  readonly baixarAnexo = (tarefaId: number) => (a: Anexo) =>
    this.service.baixarAnexo(this.contexto.filhoId()!, tarefaId, a.id);

  abrir(tarefaId: number): void {
    if (this.aberta()?.id === tarefaId) {
      this.aberta.set(null);
      return;
    }
    this.carregandoTarefa.set(tarefaId);
    this.service.tarefa(this.contexto.filhoId()!, tarefaId).subscribe({
      next: (res) => {
        this.carregandoTarefa.set(null);
        this.aberta.set(res.data);
      },
      error: () => {
        this.carregandoTarefa.set(null);
        this.erro.set('Não foi possível abrir a tarefa.');
      },
    });
  }
  readonly baixarEntrega = (tarefaId: number) => (a: Anexo) =>
    this.service.baixarEntrega(this.contexto.filhoId()!, tarefaId, a.id);

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

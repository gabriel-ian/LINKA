import { Component, computed, input } from '@angular/core';
import { TarefaResumoAluno } from '../../core/model/painel-aluno.model';
import { prazo, tituloCompleto } from './aluno-ui';

/**
 * Linha de tarefa do Figma ("Card de tarefa"): circulo, titulo e etiqueta
 * de prazo. Concluida fica riscada com o check verde.
 */
@Component({
  selector: 'app-item-tarefa',
  template: `
    <img class="marca" [src]="icone()" alt="" width="26" height="26" />
    <div class="texto">
      <p [class.feita]="concluida()">{{ titulo() }}</p>
      <span class="etiqueta" [class]="'etiqueta ' + etiqueta().cor">{{ etiqueta().texto }}</span>
    </div>
    @if (abrir()) {
      <span class="abrir" aria-hidden="true">{{ concluida() ? 'Ver' : 'Abrir' }} ›</span>
    }
  `,
  styles: `
    :host {
      display: flex;
      align-items: flex-start;
      gap: 13px;
    }
    .marca {
      flex: none;
    }
    .abrir {
      flex: none;
      align-self: center;
      margin-left: auto;
      padding: 8px 18px;
      border-radius: 12px;
      background: var(--cor-primaria);
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      white-space: nowrap;
    }
    :host-context(a:hover) .abrir {
      background: var(--cor-primaria-escura);
    }
    .texto {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      min-width: 0;
    }
    p {
      margin: 2px 0 0;
      font-size: 15px;
      font-weight: 500;
      line-height: 20px;
      color: var(--cor-texto);
    }
    p.feita {
      text-decoration: line-through;
    }
    .etiqueta {
      padding: 2px 10px;
      border-radius: 59px;
      font-size: 15px;
      font-weight: 600;
      line-height: 19px;
    }
    .verde {
      background: #e6f7f2;
      color: #059669;
    }
    .laranja {
      background: #fef0e8;
      color: #b8420a;
    }
    .azul {
      background: #e8effe;
      color: #103ba6;
    }
    .vermelho {
      background: var(--cor-erro-fundo);
      color: var(--cor-erro-texto);
    }
  `,
})
export class ItemTarefa {
  tarefa = input.required<TarefaResumoAluno>();
  /** Mostra o botao "Abrir" (a linha inteira e o link). */
  abrir = input(false);

  readonly concluida = computed(() => this.tarefa().situacao === 'concluida');
  readonly etiqueta = computed(() => prazo(this.tarefa()));
  readonly titulo = computed(() => tituloCompleto(this.tarefa()));
  readonly icone = computed(() =>
    this.concluida()
      ? 'assets/aluno/circulo-feito.svg'
      : this.etiqueta().cor === 'laranja' || this.etiqueta().cor === 'vermelho'
        ? 'assets/aluno/circulo-urgente.svg'
        : 'assets/aluno/circulo.svg',
  );
}

import { Component, input } from '@angular/core';

/** Indicador "1 Dados - 2 Confirmacao - 3 Concluido" dos cadastros. */
@Component({
  selector: 'app-etapas',
  template: `
    <ol class="etapas" aria-label="Etapas do cadastro">
      @for (nome of nomes; track nome; let i = $index) {
        <li [class.feita]="i + 1 < atual()" [class.atual]="i + 1 === atual()" [attr.aria-current]="i + 1 === atual() ? 'step' : null">
          <span class="num">{{ i + 1 }}</span>{{ nome }}
        </li>
      }
    </ol>
  `,
})
export class Etapas {
  atual = input.required<number>();
  readonly nomes = ['Dados', 'Confirmação', 'Concluído'];
}

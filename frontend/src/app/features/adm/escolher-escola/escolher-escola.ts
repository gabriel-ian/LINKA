import { Component, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Escola } from '../../../core/model/escola.model';

/**
 * Quando "Atualizar" ou "Desativar" e aberto pelo menu (sem ?id=),
 * pede a escola antes de mostrar o formulario.
 */
@Component({
  selector: 'app-escolher-escola',
  imports: [FormsModule],
  template: `
    <form class="cartao escolher" (ngSubmit)="continuar()">
      <label class="campo-p">
        Escolha a escola
        <select name="escola" [(ngModel)]="id" required>
          <option [ngValue]="null" disabled>Selecione...</option>
          @for (e of escolas(); track e.id) {
            <option [ngValue]="e.id">#{{ e.id }} - {{ e.nome }}</option>
          }
        </select>
      </label>
      <button type="submit" class="bt bt-primario" [disabled]="id === null">Continuar</button>
    </form>
    @if (!escolas().length) {
      <p class="vazio">Nenhuma escola disponível para esta ação.</p>
    }
  `,
  styles: `
    .escolher {
      flex-direction: row;
      align-items: flex-end;
      gap: 16px;
    }
    .campo-p {
      flex: 1;
    }
  `,
})
export class EscolherEscola {
  private router = inject(Router);

  escolas = input.required<Escola[]>();
  id: number | null = null;

  continuar(): void {
    if (this.id !== null) {
      this.router.navigate([], { queryParams: { id: this.id } });
    }
  }
}

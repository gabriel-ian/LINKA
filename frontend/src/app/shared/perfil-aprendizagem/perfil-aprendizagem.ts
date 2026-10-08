import { Component, model, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Campos do perfil de aprendizagem (dificuldades, pontos fortes,
 * interesses). A IA usa esses dados para adaptar as tarefas.
 */
@Component({
  selector: 'app-perfil-aprendizagem',
  imports: [FormsModule],
  template: `
    <p class="ajuda-ia">
      <span aria-hidden="true">✦</span>
      A Linka usa estas informações para adaptar as tarefas - por exemplo, criar exemplos com os interesses do aluno.
    </p>
    <label class="campo-p">
      Maiores dificuldades
      <textarea name="dificuldades" rows="3" maxlength="1000" [ngModel]="dificuldades()" (ngModelChange)="dificuldades.set($event)"
        placeholder="Ex.: iniciar tarefas, manter o foco por mais de 10 minutos, organizar o material."></textarea>
    </label>
    <label class="campo-p">
      Pontos fortes
      <textarea name="pontosFortes" rows="3" maxlength="1000" [ngModel]="pontosFortes()" (ngModelChange)="pontosFortes.set($event)"
        placeholder="Ex.: criatividade, raciocínio visual, bom desempenho quando motivado."></textarea>
    </label>
    <div class="campo-p">
      <label for="novo-interesse">Interesses</label>
      <div class="interesses">
        @for (i of interesses(); track i) {
          <span class="interesse">
            {{ i }}
            <button type="button" [attr.aria-label]="'Remover ' + i" (click)="remover(i)">×</button>
          </span>
        }
        <input id="novo-interesse" name="novoInteresse" maxlength="40" [(ngModel)]="novo"
          [placeholder]="interesses().length ? 'Adicionar outro' : 'Ex.: Dinossauros (Enter para adicionar)'"
          (keydown.enter)="$event.preventDefault(); adicionar()" (blur)="adicionar()" />
      </div>
      @if (limite()) { <span class="msg-erro">Até 10 interesses.</span> }
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: 14px; }
    .ajuda-ia { margin: 0; padding: 12px 14px; border-radius: 12px; background: #f3e8ff; color: #5b21b6; font-size: 14px; font-weight: 500; }
    .interesses { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-height: 45px; padding: 6px 10px;
      border: 1px solid var(--cor-borda); border-radius: var(--raio); background: #fff; }
    .interesse { display: inline-flex; align-items: center; gap: 4px; padding: 4px 6px 4px 12px; border-radius: 59px;
      background: var(--cor-primaria-clara); color: var(--cor-azul-forte); font-size: 14px; font-weight: 600; }
    .interesse button { border: none; background: none; color: inherit; font-size: 16px; line-height: 1; cursor: pointer; }
    .interesses input { flex: 1; min-width: 160px; height: 32px; border: none; outline: none; font-size: 15px; font-weight: 500; }
    .campo-p .msg-erro { color: var(--cor-erro); }
  `,
})
export class PerfilAprendizagemForm {
  dificuldades = model('');
  pontosFortes = model('');
  interesses = model<string[]>([]);

  novo = '';
  readonly limite = signal(false);

  adicionar(): void {
    const valor = this.novo.replace(/,/g, ' ').trim();
    this.novo = '';
    if (!valor || this.interesses().some((i) => i.toLowerCase() === valor.toLowerCase())) return;
    if (this.interesses().length >= 10) {
      this.limite.set(true);
      return;
    }
    this.interesses.update((l) => [...l, valor]);
  }

  remover(valor: string): void {
    this.limite.set(false);
    this.interesses.update((l) => l.filter((i) => i !== valor));
  }
}

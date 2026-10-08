import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

/** Janela para o usuario logado trocar a propria senha. */
@Component({
  selector: 'app-alterar-senha',
  imports: [FormsModule],
  template: `
    <div class="fundo" (click)="fechar.emit()">
      <form class="janela" role="dialog" aria-modal="true" aria-labelledby="titulo-alterar" (click)="$event.stopPropagation()" (ngSubmit)="salvar()" novalidate>
        <h2 id="titulo-alterar">Alterar minha senha</h2>
        @if (concluido()) {
          <p class="aviso-caixa verde">Senha alterada. Use a nova senha no próximo acesso.</p>
          <div class="acoes"><button type="button" class="bt bt-primario" (click)="fechar.emit()">Fechar</button></div>
        } @else {
          <label class="campo-p">
            Senha atual
            <input name="atual" type="password" autocomplete="current-password" [(ngModel)]="atual" />
          </label>
          <label class="campo-p" [class.invalido]="erroNova()">
            Nova senha
            <input name="nova" type="password" autocomplete="new-password" [(ngModel)]="nova" placeholder="Mínimo 8 caracteres" />
          </label>
          <label class="campo-p" [class.invalido]="erroNova()">
            Repita a nova senha
            <input name="repetir" type="password" autocomplete="new-password" [(ngModel)]="repetir" />
            @if (erroNova()) { <span class="msg-erro">{{ erroNova() }}</span> }
          </label>
          @if (erro()) { <p class="alerta-erro" role="alert">{{ erro() }}</p> }
          <div class="acoes">
            <button type="button" class="bt bt-secundario" (click)="fechar.emit()">Cancelar</button>
            <button type="submit" class="bt bt-primario" [disabled]="salvando()">{{ salvando() ? 'Salvando...' : 'Salvar' }}</button>
          </div>
        }
      </form>
    </div>
  `,
  styleUrl: './janela.css',
})
export class AlterarSenha {
  private auth = inject(AuthService);
  fechar = output<void>();

  atual = '';
  nova = '';
  repetir = '';
  readonly erroNova = signal('');
  readonly erro = signal('');
  readonly salvando = signal(false);
  readonly concluido = signal(false);

  salvar(): void {
    this.erro.set('');
    this.erroNova.set(
      this.nova.length < 8 ? 'A nova senha precisa de pelo menos 8 caracteres.' : this.nova !== this.repetir ? 'As senhas não coincidem.' : '',
    );
    if (this.erroNova() || !this.atual) {
      if (!this.atual) this.erro.set('Informe a senha atual.');
      return;
    }

    this.salvando.set(true);
    this.auth.alterarSenha(this.atual, this.nova).subscribe({
      next: () => {
        this.salvando.set(false);
        this.concluido.set(true);
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        const msg = [e.error?.message].flat().join(' ');
        this.erro.set(/atual/i.test(msg) ? 'A senha atual está incorreta.' : /diferente/i.test(msg) ? 'A nova senha precisa ser diferente da atual.' : 'Não foi possível alterar a senha agora.');
      },
    });
  }
}

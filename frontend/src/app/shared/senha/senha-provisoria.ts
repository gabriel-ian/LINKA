import { Component, input, output, signal } from '@angular/core';

/** Janela que mostra UMA vez a senha provisoria gerada para alguem. */
@Component({
  selector: 'app-senha-provisoria',
  template: `
    <div class="fundo" (click)="fechar.emit()">
      <div class="janela" role="dialog" aria-modal="true" aria-labelledby="titulo-senha" (click)="$event.stopPropagation()">
        <h2 id="titulo-senha">Nova senha de {{ nome() }}</h2>
        <p>Entregue estes dados a {{ nome() }}. Por segurança, a senha não será mostrada de novo.</p>
        <dl>
          <dt>E-mail</dt>
          <dd>{{ email() }}</dd>
          <dt>Senha provisória</dt>
          <dd><code>{{ senha() }}</code></dd>
        </dl>
        <p class="dica">No primeiro acesso, peça para trocar a senha em "Alterar minha senha".</p>
        <div class="acoes">
          <button type="button" class="bt bt-secundario" (click)="copiar()">{{ copiado() ? 'Copiado!' : 'Copiar' }}</button>
          <button type="button" class="bt bt-primario" (click)="fechar.emit()">Pronto</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './janela.css',
})
export class SenhaProvisoria {
  nome = input.required<string>();
  email = input.required<string>();
  senha = input.required<string>();
  fechar = output<void>();

  readonly copiado = signal(false);

  copiar(): void {
    navigator.clipboard
      ?.writeText(`E-mail: ${this.email()}\nSenha provisória: ${this.senha()}`)
      .then(() => this.copiado.set(true))
      .catch(() => undefined);
  }
}

import { Component, inject, output, signal } from '@angular/core';
import { PainelFamiliaService } from '../../core/services/painel-familia.service';
import { TERMO_VERSAO, TermoTexto } from '../../shared/termo/termo-texto';

/** Primeiro acesso da familia (ou termo novo): ler e aceitar antes do painel. */
@Component({
  selector: 'app-termo-aceite',
  imports: [TermoTexto],
  template: `
    <section class="cartao aceite">
      <h1 class="cartao-titulo">Antes de começar: privacidade e uso dos dados</h1>
      <p class="intro">
        A Linka guarda dados escolares e de saúde do seu filho(a). Leia como cuidamos deles.
      </p>
      <div class="rolagem" tabindex="0" aria-label="Termo de uso e privacidade">
        <app-termo-texto />
      </div>
      @if (erro()) {
        <p class="alerta-erro" role="alert">{{ erro() }}</p>
      }
      <label class="marcar">
        <input type="checkbox" [checked]="li()" (change)="li.set(!li())" />
        Li e concordo com o uso dos dados do meu filho(a) descrito acima
      </label>
      <div class="acoes">
        <button
          type="button"
          class="bt bt-primario"
          [disabled]="!li() || salvando()"
          (click)="aceitar()"
        >
          {{ salvando() ? 'Salvando...' : 'Aceitar e continuar' }}
        </button>
      </div>
    </section>
  `,
  styles: `
    .aceite {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 760px;
    }
    .intro {
      margin: 0;
      font-size: 16px;
    }
    .rolagem {
      max-height: 46vh;
      overflow-y: auto;
      padding: 4px 16px;
      border: 1px solid #e2e5ea;
      border-radius: 12px;
      background: #fafbfc;
    }
    .marcar {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 15px;
      font-weight: 600;
    }
    .marcar input {
      margin-top: 3px;
    }
  `,
})
export class TermoAceite {
  private service = inject(PainelFamiliaService);
  readonly aceito = output<void>();
  readonly li = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal('');

  aceitar(): void {
    this.salvando.set(true);
    this.erro.set('');
    this.service.aceitarTermo(TERMO_VERSAO).subscribe({
      next: () => this.aceito.emit(),
      error: () => {
        this.salvando.set(false);
        this.erro.set('Não foi possível salvar agora. Recarregue a página e tente de novo.');
      },
    });
  }
}

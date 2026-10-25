import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { DialogoService } from '../../core/services/dialogo.service';

/** Desenha a janela de confirmacao e os avisos do DialogoService. Fica na raiz do app. */
@Component({
  selector: 'app-dialogo-host',
  template: `
    @if (dialogo.pergunta(); as p) {
      <div class="fundo" (click)="dialogo.responderPergunta(false)">
        <div
          class="janela"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="titulo-confirmacao"
          aria-describedby="texto-confirmacao"
          (click)="$event.stopPropagation()"
          (keydown.escape)="dialogo.responderPergunta(false)"
        >
          <span class="icone" [class.perigo]="p.perigo" aria-hidden="true">{{
            p.perigo ? '!' : '?'
          }}</span>
          <h2 id="titulo-confirmacao">{{ p.titulo }}</h2>
          <p id="texto-confirmacao">{{ p.mensagem }}</p>
          <div class="acoes">
            <button
              #cancelar
              type="button"
              class="bt bt-secundario"
              (click)="dialogo.responderPergunta(false)"
            >
              {{ p.cancelar ?? 'Cancelar' }}
            </button>
            <button
              type="button"
              class="bt"
              [class.bt-primario]="!p.perigo"
              [class.bt-perigo-cheio]="p.perigo"
              (click)="dialogo.responderPergunta(true)"
            >
              {{ p.confirmar ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <div class="avisos" aria-live="polite">
      @for (a of dialogo.avisos(); track a.id) {
        <div class="aviso" [class]="'aviso ' + a.tipo" role="status">
          <span class="marca" aria-hidden="true">{{
            a.tipo === 'sucesso' ? '✓' : a.tipo === 'erro' ? '!' : 'i'
          }}</span>
          <span class="texto">{{ a.texto }}</span>
          <button type="button" aria-label="Fechar aviso" (click)="dialogo.fecharAviso(a.id)">
            ×
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .fundo {
      position: fixed;
      inset: 0;
      z-index: 60;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(15, 23, 42, 0.55);
      animation: aparecer 0.15s ease-out;
    }

    .janela {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      width: 440px;
      max-width: 100%;
      padding: 28px 24px 24px;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
      text-align: center;
    }

    .icone {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--cor-primaria-clara);
      color: var(--cor-primaria-escura);
      font-size: 28px;
      font-weight: 800;
    }

    .icone.perigo {
      background: var(--cor-erro-fundo);
      color: var(--cor-erro-texto);
    }

    h2 {
      margin: 0;
      color: var(--cor-titulo);
      font-size: 21px;
      font-weight: 700;
    }

    p {
      margin: 0;
      font-size: 16px;
      line-height: 1.5;
    }

    .acoes {
      display: flex;
      gap: 12px;
      width: 100%;
      margin-top: 8px;
    }

    .acoes .bt {
      flex: 1;
    }

    .avisos {
      position: fixed;
      right: 20px;
      bottom: 20px;
      z-index: 70;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: min(420px, calc(100vw - 32px));
    }

    .aviso {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 12px 12px 14px;
      border-radius: 14px;
      background: #fff;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
      border-left: 5px solid var(--cor-sucesso);
      animation: subir 0.2s ease-out;
    }

    .aviso.erro {
      border-left-color: var(--cor-erro);
    }

    .aviso.info {
      border-left-color: var(--cor-primaria);
    }

    .marca {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: var(--cor-sucesso-fundo);
      color: var(--cor-sucesso);
      font-weight: 800;
    }

    .erro .marca {
      background: var(--cor-erro-fundo);
      color: var(--cor-erro);
    }

    .info .marca {
      background: var(--cor-primaria-clara);
      color: var(--cor-primaria-escura);
    }

    .texto {
      flex: 1;
      color: var(--cor-titulo);
      font-size: 15px;
      font-weight: 600;
    }

    .aviso button {
      border: 0;
      background: none;
      color: var(--cor-texto);
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
    }

    @keyframes aparecer {
      from {
        opacity: 0;
      }
    }

    @keyframes subir {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
    }

    @media (max-width: 600px) {
      /* Celular: acima da barra de abas. */
      .avisos {
        right: 16px;
        bottom: 90px;
        left: 16px;
        max-width: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .fundo,
      .aviso {
        animation: none;
      }
    }
  `,
})
export class DialogoHost {
  readonly dialogo = inject(DialogoService);
  private cancelar = viewChild<ElementRef<HTMLButtonElement>>('cancelar');

  constructor() {
    // Foco no "Cancelar" ao abrir: Enter sem querer nao confirma nada.
    effect(() => {
      if (this.dialogo.pergunta()) queueMicrotask(() => this.cancelar()?.nativeElement.focus());
    });
  }
}

import { Component, computed, input } from '@angular/core';

/**
 * Blocos cinza piscando no formato do conteudo enquanto a tela carrega (no
 * lugar de "Carregando..."). tipo 'pagina': titulo + numeros + lista;
 * 'lista': so linhas; 'cartoes': uma grade de cartoes.
 */
@Component({
  selector: 'app-esqueleto',
  template: `
    <div class="esqueleto" role="status" aria-live="polite" [attr.aria-label]="rotulo()">
      @if (tipo() === 'pagina') {
        <div class="bloco titulo"></div>
        <div class="bloco subtitulo"></div>
        <div class="grade">
          @for (i of quatro; track i) {
            <div class="bloco cartao"></div>
          }
        </div>
      }
      @if (tipo() === 'cartoes') {
        <div class="grade">
          @for (i of itens(); track i) {
            <div class="bloco cartao"></div>
          }
        </div>
      } @else {
        <div class="lista">
          @for (i of itens(); track i) {
            <div class="linha">
              <div class="bloco bolinha"></div>
              <div class="textos">
                <div class="bloco texto" [style.width.%]="70 - (i % 3) * 12"></div>
                <div class="bloco texto curto"></div>
              </div>
            </div>
          }
        </div>
      }
      <span class="sr-only">{{ rotulo() }}</span>
    </div>
  `,
  styles: `
    .esqueleto {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .bloco {
      border-radius: 10px;
      background: linear-gradient(90deg, #e9eef4 0%, #f5f8fb 50%, #e9eef4 100%);
      background-size: 200% 100%;
      animation: brilho 1.3s ease-in-out infinite;
    }

    .titulo {
      width: 280px;
      max-width: 70%;
      height: 34px;
    }

    .subtitulo {
      width: 420px;
      max-width: 90%;
      height: 18px;
    }

    .grade {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
    }

    .cartao {
      height: 110px;
      border-radius: 16px;
    }

    .lista {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 20px;
      border-radius: 16px;
      background: #fff;
    }

    .linha {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .bolinha {
      flex: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .textos {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 8px;
    }

    .texto {
      height: 14px;
    }

    .texto.curto {
      width: 35%;
      height: 12px;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    @keyframes brilho {
      from {
        background-position: 100% 0;
      }
      to {
        background-position: -100% 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .bloco {
        animation: none;
      }
    }
  `,
})
export class Esqueleto {
  readonly tipo = input<'pagina' | 'lista' | 'cartoes'>('lista');
  readonly linhas = input(4);
  readonly rotulo = input('Carregando...');

  readonly quatro = [0, 1, 2, 3];
  readonly itens = computed(() => Array.from({ length: this.linhas() }, (_, i) => i));
}

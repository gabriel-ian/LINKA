import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { AcessibilidadeEntradaService } from '../../core/services/acessibilidade-entrada.service';
import { VozService } from '../../core/services/voz.service';
import { MASCOTES, MascoteDesenho, infoMascote } from '../mascote/mascote';

/** Texto que o mascote le quando o aluno toca (ou chega com o Tab) em algo. */
function textoDe(el: Element): string {
  const aria = el.getAttribute('aria-label');
  if (aria) return aria;
  const rotulo = el.closest('label')?.querySelector('.campo-rotulo')?.textContent;
  if (rotulo) return `Campo ${rotulo.trim()}. Escreva aqui.`;
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * "Ajuda para ler" das telas de entrada: botao no canto superior direito que
 * abre um painel lateral com tamanho da letra, letra para dislexia, alto
 * contraste e o mascote que le em voz alta. Vale antes do login.
 */
@Component({
  selector: 'app-ajuda-entrada',
  imports: [MascoteDesenho],
  host: {
    '(document:focusin)': 'lerFoco($event)',
    '(document:keydown.escape)': 'aberto.set(false)',
  },
  template: `
    <button
      type="button"
      class="abrir-ajuda"
      aria-haspopup="dialog"
      [attr.aria-expanded]="aberto()"
      (click)="aberto.set(!aberto())"
    >
      <span aria-hidden="true">Aa</span> Ajuda para ler
    </button>

    @if (ajudas().lerEmVoz && fala()) {
      <div class="fala-mascote" role="status">
        <app-mascote class="fala-desenho" [tipo]="ajudas().mascote" />
        <button type="button" class="fala-balao" (click)="falar(fala())">
          🔊 {{ fala() }}
        </button>
      </div>
    }

    @if (aberto()) {
      <div class="fundo-ajuda" (click)="aberto.set(false)"></div>
      <aside class="painel-ajuda" role="dialog" aria-modal="true" aria-labelledby="titulo-ajuda">
        <header>
          <h2 id="titulo-ajuda">Como eu gosto de ler</h2>
          <button type="button" class="fechar" aria-label="Fechar" (click)="aberto.set(false)">
            ×
          </button>
        </header>
        <p class="explica">Deixe a tela do seu jeito antes de entrar. Fica salvo neste aparelho.</p>

        <section>
          <h3 id="t-tamanho">Tamanho da letra</h3>
          <div class="opcoes-4" role="radiogroup" aria-labelledby="t-tamanho">
            @for (t of tamanhos; track t.valor) {
              <button
                type="button"
                role="radio"
                [attr.aria-checked]="ajudas().tamanhoLetra === t.valor"
                [class.ativo]="ajudas().tamanhoLetra === t.valor"
                (click)="servico.mudar({ tamanhoLetra: t.valor })"
              >
                <span class="amostra" [style.font-size.px]="t.amostra">Aa</span>
                {{ t.nome }}
              </button>
            }
          </div>
        </section>

        <section class="chaves">
          <label>
            <span>
              <strong>Letra para dislexia</strong>
              <small>Mais espaço entre as letras e as linhas</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              [checked]="ajudas().fonteDislexia"
              (change)="servico.mudar({ fonteDislexia: $any($event.target).checked })"
            />
          </label>
          <label>
            <span>
              <strong>Alto contraste</strong>
              <small>Texto mais escuro e bordas fortes</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              [checked]="ajudas().altoContraste"
              (change)="servico.mudar({ altoContraste: $any($event.target).checked })"
            />
          </label>
          <label>
            <span>
              <strong>O mascote lê para mim</strong>
              <small>Lê em voz alta o que você tocar na tela</small>
            </span>
            <input
              type="checkbox"
              role="switch"
              [checked]="ajudas().lerEmVoz"
              (change)="ligarVoz($any($event.target).checked)"
            />
          </label>
        </section>

        @if (ajudas().lerEmVoz) {
          <section>
            <h3 id="t-mascote">Quem lê</h3>
            <div class="mascotes" role="radiogroup" aria-labelledby="t-mascote">
              @for (m of mascotes; track m.id) {
                <button
                  type="button"
                  role="radio"
                  [attr.aria-checked]="ajudas().mascote === m.id"
                  [class.ativo]="ajudas().mascote === m.id"
                  (click)="escolherMascote(m.id)"
                >
                  <app-mascote class="mini" [tipo]="m.id" />
                  {{ m.nome }}
                </button>
              }
            </div>
          </section>
        }

        @if (instrucoes()) {
          <button type="button" class="bt bt-primario ouvir" (click)="falar(instrucoes())">
            🔊 Ouvir como entrar
          </button>
        }
        <button type="button" class="link-acao" (click)="servico.limpar()">
          Voltar ao normal
        </button>
      </aside>
    }
  `,
  styleUrl: './ajuda-entrada.css',
})
export class AjudaEntrada {
  readonly servico = inject(AcessibilidadeEntradaService);
  private voz = inject(VozService);

  /** O passo a passo da tela, lido no "Ouvir como entrar". */
  readonly instrucoes = input('');

  readonly ajudas = this.servico.ajudas;
  readonly aberto = signal(false);
  readonly fala = signal('');
  readonly mascotes = MASCOTES;
  readonly tom = computed(() => infoMascote(this.ajudas().mascote).tom);
  readonly tamanhos: { valor: 0 | 1 | 2 | 3; nome: string; amostra: number }[] = [
    { valor: 0, nome: 'Normal', amostra: 16 },
    { valor: 1, nome: 'Grande', amostra: 19 },
    { valor: 2, nome: 'Maior', amostra: 22 },
    { valor: 3, nome: 'Enorme', amostra: 26 },
  ];

  constructor() {
    inject(DestroyRef).onDestroy(() => this.voz.parar());
  }

  falar(texto: string): void {
    if (!texto) return;
    this.fala.set(texto);
    this.voz.falar(texto, false, { voz: null, velocidade: 'normal', tom: this.tom() });
  }

  ligarVoz(ligar: boolean): void {
    this.servico.mudar({ lerEmVoz: ligar });
    if (ligar) this.falar('Oi! Agora eu leio para você o que você tocar na tela.');
    else this.voz.parar();
  }

  escolherMascote(id: (typeof MASCOTES)[number]['id']): void {
    this.servico.mudar({ mascote: id });
    const m = infoMascote(id);
    this.falar(`Oi! Eu sou ${m.id === 'coruja' ? 'a' : 'o'} ${m.nome}.`);
  }

  /** Com "O mascote le para mim", fala o que recebeu o foco (toque ou Tab). */
  lerFoco(e: FocusEvent): void {
    if (!this.ajudas().lerEmVoz || this.aberto()) return;
    const el = e.target as Element | null;
    if (!el || el.closest('.fala-mascote')) return;
    const texto = textoDe(el);
    if (texto) this.falar(texto);
  }
}

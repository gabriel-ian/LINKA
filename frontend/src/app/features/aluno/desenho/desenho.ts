import {
  AfterViewInit,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

const CORES = [
  '#111827',
  '#ef4444',
  '#f97316',
  '#facc15',
  '#22c55e',
  '#0ea5e9',
  '#2563eb',
  '#a855f7',
  '#ec4899',
  '#8b5a2b',
];
const TAMANHOS = [
  { nome: 'Fino', px: 4 },
  { nome: 'Médio', px: 10 },
  { nome: 'Grosso', px: 22 },
];
const LADO = 600;
const DESFAZER_MAXIMO = 20;

/**
 * Desenho livre bem simples (tipo Paint) para o cartao do Inicio: cores,
 * 3 grossuras, borracha, desfazer e limpar. Funciona com mouse e com o dedo.
 */
@Component({
  selector: 'app-desenho',
  template: `
    <div class="fundo" (click)="fechar.emit()"></div>
    <section class="janela" role="dialog" aria-modal="true" aria-labelledby="titulo-desenho">
      <header>
        <h2 id="titulo-desenho">✏️ Meu desenho</h2>
        <button type="button" class="fechar" aria-label="Fechar" (click)="fechar.emit()">×</button>
      </header>

      <div class="ferramentas">
        <div class="cores" role="radiogroup" aria-label="Cor">
          @for (c of cores; track c) {
            <button
              type="button"
              role="radio"
              class="cor"
              [style.background]="c"
              [attr.aria-checked]="cor() === c && !borracha()"
              [attr.aria-label]="'Cor ' + ($index + 1)"
              [class.ativa]="cor() === c && !borracha()"
              (click)="cor.set(c); borracha.set(false)"
            ></button>
          }
        </div>
        <div class="grupo" role="radiogroup" aria-label="Grossura">
          @for (t of tamanhos; track t.px) {
            <button
              type="button"
              role="radio"
              [attr.aria-checked]="tamanho() === t.px"
              [class.ativo]="tamanho() === t.px"
              (click)="tamanho.set(t.px)"
            >
              <span class="ponto" [style.width.px]="t.px / 1.6 + 4" [style.height.px]="t.px / 1.6 + 4"></span>
              {{ t.nome }}
            </button>
          }
        </div>
        <div class="grupo">
          <button
            type="button"
            [class.ativo]="borracha()"
            [attr.aria-pressed]="borracha()"
            (click)="borracha.set(!borracha())"
          >
            🧽 Borracha
          </button>
          <button type="button" [disabled]="!podeDesfazer()" (click)="desfazer()">↩ Desfazer</button>
          <button type="button" (click)="limpar()">🗑 Limpar</button>
        </div>
      </div>

      <canvas
        #tela
        [width]="lado"
        [height]="lado"
        aria-label="Área de desenho"
        (pointerdown)="comecar($event)"
        (pointermove)="mover($event)"
        (pointerup)="parar()"
        (pointercancel)="parar()"
        (pointerleave)="parar()"
      ></canvas>

      <footer>
        <button type="button" class="bt bt-secundario" (click)="fechar.emit()">Cancelar</button>
        <button type="button" class="bt bt-primario" [disabled]="salvando()" (click)="enviar()">
          {{ salvando() ? 'Salvando...' : 'Salvar desenho' }}
        </button>
      </footer>
    </section>
  `,
  styles: `
    .fundo {
      position: fixed;
      inset: 0;
      z-index: 90;
      background: rgba(15, 23, 42, 0.5);
    }

    .janela {
      position: fixed;
      top: 50%;
      left: 50%;
      z-index: 91;
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: min(680px, calc(100vw - 24px));
      max-height: calc(100vh - 24px);
      overflow: auto;
      padding: 18px;
      border-radius: 18px;
      background: #fff;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
      translate: -50% -50%;
    }

    header,
    footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    footer {
      justify-content: flex-end;
    }

    h2 {
      margin: 0;
      font-size: 22px;
    }

    .fechar {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 50%;
      background: #f1f5f9;
      font-size: 24px;
      cursor: pointer;
    }

    .ferramentas {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 16px;
    }

    .cores {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .cor {
      width: 34px;
      height: 34px;
      border: 3px solid #fff;
      border-radius: 50%;
      box-shadow: 0 0 0 1px #cbd5e1;
      cursor: pointer;
    }

    .cor.ativa {
      box-shadow: 0 0 0 3px var(--cor-mascote, #1d4ed8);
    }

    .grupo {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .grupo button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 38px;
      padding: 0 12px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      background: #fff;
      color: #1f2937;
      font-weight: 600;
      cursor: pointer;
    }

    .grupo button.ativo {
      border: 2px solid var(--cor-mascote, #1d4ed8);
      background: var(--cor-mascote-clara, #dbeafe);
    }

    .grupo button:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .ponto {
      display: inline-block;
      border-radius: 50%;
      background: #1f2937;
    }

    canvas {
      align-self: center;
      width: min(100%, calc(100vh - 290px));
      aspect-ratio: 1;
      border: 2px dashed #cbd5e1;
      border-radius: 14px;
      background: #fff;
      cursor: crosshair;
      touch-action: none;
    }
  `,
})
export class DesenhoAluno implements AfterViewInit {
  /** Desenho atual (URL do blob) para continuar de onde parou. */
  readonly inicial = input<string | null>(null);
  readonly salvando = input(false);
  readonly salvar = output<Blob>();
  readonly fechar = output<void>();

  readonly cores = CORES;
  readonly tamanhos = TAMANHOS;
  readonly lado = LADO;
  readonly cor = signal(CORES[0]);
  readonly tamanho = signal(TAMANHOS[1].px);
  readonly borracha = signal(false);
  readonly podeDesfazer = signal(false);

  private readonly tela = viewChild.required<ElementRef<HTMLCanvasElement>>('tela');
  private ctx!: CanvasRenderingContext2D;
  private desenhando = false;
  private ultimo: { x: number; y: number } | null = null;
  private historico: ImageData[] = [];

  ngAfterViewInit(): void {
    this.ctx = this.tela().nativeElement.getContext('2d')!;
    this.pintarFundo();
    const url = this.inicial();
    if (url) {
      const img = new Image();
      img.onload = () => this.ctx.drawImage(img, 0, 0, LADO, LADO);
      img.src = url;
    }
  }

  private pintarFundo(): void {
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, LADO, LADO);
  }

  private ponto(e: PointerEvent): { x: number; y: number } {
    const r = this.tela().nativeElement.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * LADO, y: ((e.clientY - r.top) / r.height) * LADO };
  }

  comecar(e: PointerEvent): void {
    e.preventDefault();
    this.tela().nativeElement.setPointerCapture?.(e.pointerId);
    this.historico.push(this.ctx.getImageData(0, 0, LADO, LADO));
    if (this.historico.length > DESFAZER_MAXIMO) this.historico.shift();
    this.podeDesfazer.set(true);
    this.desenhando = true;
    this.ultimo = this.ponto(e);
    this.traco(this.ultimo, this.ultimo);
  }

  mover(e: PointerEvent): void {
    if (!this.desenhando || !this.ultimo) return;
    const agora = this.ponto(e);
    this.traco(this.ultimo, agora);
    this.ultimo = agora;
  }

  parar(): void {
    this.desenhando = false;
    this.ultimo = null;
  }

  private traco(de: { x: number; y: number }, ate: { x: number; y: number }): void {
    const c = this.ctx;
    c.strokeStyle = this.borracha() ? '#fff' : this.cor();
    c.lineWidth = this.borracha() ? this.tamanho() * 2 : this.tamanho();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(de.x, de.y);
    c.lineTo(ate.x + 0.01, ate.y + 0.01);
    c.stroke();
  }

  desfazer(): void {
    const anterior = this.historico.pop();
    if (anterior) this.ctx.putImageData(anterior, 0, 0);
    this.podeDesfazer.set(this.historico.length > 0);
  }

  limpar(): void {
    this.historico.push(this.ctx.getImageData(0, 0, LADO, LADO));
    this.podeDesfazer.set(true);
    this.pintarFundo();
  }

  enviar(): void {
    this.tela().nativeElement.toBlob((blob) => blob && this.salvar.emit(blob), 'image/png');
  }
}

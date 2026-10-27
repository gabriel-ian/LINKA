import { Injectable, signal } from '@angular/core';

export type VelocidadeVoz = 'devagar' | 'normal' | 'rapida';

const RITMO: Record<VelocidadeVoz, number> = { devagar: 0.75, normal: 0.95, rapida: 1.15 };

/** Jeito de falar do aluno: voz escolhida, velocidade e tom do mascote. */
export interface ConfigVoz {
  /** Nome da voz do navegador; null = a primeira em portugues. */
  voz: string | null;
  velocidade: VelocidadeVoz;
  /** Tom (pitch) do mascote: 1 e o normal. */
  tom: number;
}

const PADRAO: ConfigVoz = { voz: null, velocidade: 'normal', tom: 1 };

/**
 * "Ouvir" e a voz do mascote: leitura em voz alta do proprio navegador
 * (Web Speech API), em portugues. Nao precisa de servidor nem de internet
 * na maioria dos sistemas.
 */
@Injectable({ providedIn: 'root' })
export class VozService {
  private readonly sintese = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  private config: ConfigVoz = PADRAO;

  readonly disponivel = !!this.sintese;
  /** Texto sendo lido agora (para destacar o botao que esta falando). */
  readonly falando = signal<string | null>(null);
  /** Vozes em portugues do aparelho (a lista chega depois de abrir a pagina). */
  readonly vozes = signal<SpeechSynthesisVoice[]>([]);

  constructor() {
    if (!this.sintese) return;
    const carregar = () =>
      this.vozes.set(
        this.sintese!.getVoices().filter((v) => v.lang.toLowerCase().startsWith('pt')),
      );
    carregar();
    this.sintese.addEventListener?.('voiceschanged', carregar);
  }

  /** O aluno escolhe a voz e a velocidade; o mascote define o tom. */
  configurar(config: Partial<ConfigVoz> | null): void {
    this.config = { ...PADRAO, ...(config ?? {}) };
  }

  /** devagar: "O mascote le bem devagar" na tela de ajuda. */
  falar(texto: string, devagar = false, config: ConfigVoz = this.config): void {
    if (!this.sintese || !texto.trim()) return;
    this.sintese.cancel();

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.rate = RITMO[config.velocidade] * (devagar ? 0.8 : 1);
    fala.pitch = config.tom;
    const vozes = this.vozes().length
      ? this.vozes()
      : this.sintese.getVoices().filter((v) => v.lang.toLowerCase().startsWith('pt'));
    const voz =
      vozes.find((v) => v.name === config.voz) ??
      vozes.find((v) => v.lang.toLowerCase() === 'pt-br') ??
      vozes[0];
    if (voz) fala.voice = voz;

    fala.onend = fala.onerror = () => {
      if (this.falando() === texto) this.falando.set(null);
    };
    this.falando.set(texto);
    this.sintese.speak(fala);
  }

  parar(): void {
    this.sintese?.cancel();
    this.falando.set(null);
  }
}

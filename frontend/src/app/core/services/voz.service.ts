import { Injectable, signal } from '@angular/core';

/**
 * "Ouvir" e a voz do mascote: leitura em voz alta do proprio navegador
 * (Web Speech API), em portugues. Nao precisa de servidor nem de internet
 * na maioria dos sistemas.
 */
@Injectable({ providedIn: 'root' })
export class VozService {
  private readonly sintese = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

  readonly disponivel = !!this.sintese;
  /** Texto sendo lido agora (para destacar o botao que esta falando). */
  readonly falando = signal<string | null>(null);

  /** devagar: "O Dino le bem devagar" na tela de ajuda. */
  falar(texto: string, devagar = false): void {
    if (!this.sintese || !texto.trim()) return;
    this.sintese.cancel();

    const fala = new SpeechSynthesisUtterance(texto);
    fala.lang = 'pt-BR';
    fala.rate = devagar ? 0.75 : 0.95;
    const voz = this.sintese.getVoices().find((v) => v.lang.toLowerCase().startsWith('pt'));
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

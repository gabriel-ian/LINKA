import { Injectable, effect, signal } from '@angular/core';
import { Mascote } from '../model/painel-aluno.model';

/** Ajudas das telas de entrada (login, senha), antes de saber quem e o aluno. */
export interface AjudasEntrada {
  /** 0 normal, 1 grande, 2 maior, 3 enorme. */
  tamanhoLetra: 0 | 1 | 2 | 3;
  fonteDislexia: boolean;
  altoContraste: boolean;
  /** O mascote le em voz alta o que o aluno toca. */
  lerEmVoz: boolean;
  mascote: Mascote;
}

const CHAVE = 'linka-ajudas-entrada';
const PADRAO: AjudasEntrada = {
  tamanhoLetra: 0,
  fonteDislexia: false,
  altoContraste: false,
  lerEmVoz: false,
  mascote: 'dino',
};

function lerGuardadas(): AjudasEntrada {
  try {
    return { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) ?? '{}') };
  } catch {
    return PADRAO;
  }
}

/**
 * Guarda as ajudas neste aparelho e as aplica como classes no <html>; o CSS
 * global so as usa dentro do app-entrada-layout (os paineis tem as suas).
 */
@Injectable({ providedIn: 'root' })
export class AcessibilidadeEntradaService {
  readonly ajudas = signal<AjudasEntrada>(lerGuardadas());

  constructor() {
    effect(() => {
      const a = this.ajudas();
      const html = document.documentElement.classList;
      for (const n of [1, 2, 3]) html.toggle(`a11y-letra-${n}`, a.tamanhoLetra === n);
      html.toggle('a11y-dislexia', a.fonteDislexia);
      html.toggle('a11y-contraste', a.altoContraste);
      try {
        localStorage.setItem(CHAVE, JSON.stringify(a));
      } catch {
        // Sem armazenamento: vale so ate fechar a pagina.
      }
    });
  }

  mudar(parte: Partial<AjudasEntrada>): void {
    this.ajudas.update((a) => ({ ...a, ...parte }));
  }

  limpar(): void {
    this.ajudas.set(PADRAO);
  }
}

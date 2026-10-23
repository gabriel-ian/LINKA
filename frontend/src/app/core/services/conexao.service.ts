import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';

/**
 * Se a Linka esta conseguindo falar com o servidor. Comeca pelo que o
 * navegador sabe (navigator.onLine) e e corrigido pelas proprias requisicoes:
 * uma que nem chega ao servidor marca offline, uma que responde marca online.
 */
@Injectable({ providedIn: 'root' })
export class ConexaoService {
  readonly online = signal(typeof navigator === 'undefined' ? true : navigator.onLine);

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', () => this.online.set(true));
    window.addEventListener('offline', () => this.online.set(false));
  }

  /**
   * O pedido nao chegou ao servidor: status 0 (erro de rede) ou 504, que e o
   * que o service worker devolve quando esta sem internet.
   */
  static semRede(erro: unknown): boolean {
    return erro instanceof HttpErrorResponse && (erro.status === 0 || erro.status === 504);
  }
}

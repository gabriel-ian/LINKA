import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/** Endereco sem ?query e #ancora: a mesma tela com outro recado e a mesma tela. */
function tela(url: string): string {
  return url.split(/[?#]/)[0];
}

/**
 * Botao "Voltar" que volta para onde a pessoa estava (ex.: a tarefa aberta
 * pela Agenda volta para a Agenda). Guarda as telas visitadas na Linka; se a
 * tela foi aberta direto (link do e-mail, F5), nao ha para onde voltar e usa
 * o destino padrao.
 */
@Injectable({ providedIn: 'root' })
export class NavegacaoService {
  private router = inject(Router);
  private location = inject(Location);
  private pilha: string[] = [];
  /** Recado para a tela de destino (ex.: "Tarefa atualizada"), lido uma vez. */
  private recado: Record<string, string | number> | null = null;

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.registrar(e.urlAfterRedirects));
  }

  private registrar(url: string): void {
    const nav = this.router.lastSuccessfulNavigation();
    if (nav?.trigger === 'popstate') {
      // Voltar/avancar do navegador: corta a pilha ate essa tela, se ja estava nela.
      const i = this.pilha.lastIndexOf(url);
      if (i >= 0) {
        this.pilha.length = i + 1;
        return;
      }
    } else if (nav?.extras.replaceUrl && this.pilha.length) {
      this.pilha[this.pilha.length - 1] = url;
      return;
    }
    this.pilha.push(url);
  }

  /** Quantos passos voltar ate a ultima tela diferente da atual (0 = nenhuma). */
  private passosAteAnterior(): number {
    const atual = tela(this.pilha.at(-1) ?? '');
    for (let i = this.pilha.length - 2; i >= 0; i--)
      if (tela(this.pilha[i]) !== atual) return this.pilha.length - 1 - i;
    return 0;
  }

  /** Ha uma tela anterior da Linka no historico. */
  get temAnterior(): boolean {
    return this.passosAteAnterior() > 0;
  }

  voltar(padrao: string, recado?: Record<string, string | number>): void {
    this.recado = recado ?? null;
    const passos = this.passosAteAnterior();
    if (passos) this.location.historyGo(-passos);
    else this.router.navigateByUrl(padrao, { replaceUrl: true });
  }

  lerRecado(): Record<string, string | number> | null {
    const r = this.recado;
    this.recado = null;
    return r;
  }
}

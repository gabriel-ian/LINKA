import { Injectable, signal } from '@angular/core';

/** Pergunta de confirmacao no visual da Linka (no lugar do confirm() do navegador). */
export interface Confirmacao {
  titulo: string;
  mensagem: string;
  /** Texto do botao que confirma (padrao "Confirmar"). */
  confirmar?: string;
  /** Texto do botao que desiste (padrao "Cancelar"). */
  cancelar?: string;
  /** Acao que apaga ou nao tem volta: botao vermelho. */
  perigo?: boolean;
}

export interface Aviso {
  id: number;
  texto: string;
  tipo: 'sucesso' | 'erro' | 'info';
}

/**
 * Janelas de confirmacao e avisos rapidos ("toasts") de todo o app. Quem usa
 * so chama confirmar()/avisar(); o DialogoHost (na raiz do app) desenha.
 */
@Injectable({ providedIn: 'root' })
export class DialogoService {
  readonly pergunta = signal<Confirmacao | null>(null);
  readonly avisos = signal<Aviso[]>([]);
  private responder: ((sim: boolean) => void) | null = null;
  private proximoId = 1;

  /** Abre a janela e resolve true se a pessoa confirmar. */
  confirmar(c: Confirmacao): Promise<boolean> {
    this.responder?.(false);
    this.pergunta.set(c);
    return new Promise((resolve) => (this.responder = resolve));
  }

  responderPergunta(sim: boolean): void {
    this.pergunta.set(null);
    const r = this.responder;
    this.responder = null;
    r?.(sim);
  }

  /** Aviso pequeno no canto, que some sozinho. */
  avisar(texto: string, tipo: Aviso['tipo'] = 'sucesso', duracaoMs = 4500): void {
    const id = this.proximoId++;
    this.avisos.update((l) => [...l, { id, texto, tipo }]);
    setTimeout(() => this.fecharAviso(id), duracaoMs);
  }

  fecharAviso(id: number): void {
    this.avisos.update((l) => l.filter((a) => a.id !== id));
  }
}

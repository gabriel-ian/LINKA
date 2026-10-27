import { Component, inject, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Anexo, ANEXO_VISUALIZAVEL } from '../../core/model/anexo.model';
import { DialogoService } from '../../core/services/dialogo.service';

const ROTULO: Record<Anexo['tipo'], string> = {
  pdf: 'PDF',
  png: 'Imagem',
  jpg: 'Imagem',
  doc: 'Word',
  docx: 'Word',
};

/** "120 KB", "2,4 MB". */
export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Lista dos materiais da tarefa com "Ver" (PDF e imagem abrem no navegador),
 * "Baixar" e, para o professor, "Tirar". O arquivo vem pela API com o token.
 */
@Component({
  selector: 'app-anexos-lista',
  template: `
    <ul class="anexos">
      @for (a of anexos(); track a.id) {
        <li>
          <span class="icone" [class]="'icone ' + a.tipo" aria-hidden="true">{{
            rotulo(a) === 'Imagem' ? '🖼️' : rotulo(a) === 'Word' ? 'W' : 'PDF'
          }}</span>
          <span class="info">
            <strong [title]="a.nome">{{ a.nome }}</strong>
            <small>{{ rotulo(a) }} · {{ tamanho(a.tamanho) }}</small>
          </span>
          <span class="acoes">
            @if (visualizavel(a)) {
              <button
                type="button"
                class="bt bt-secundario bt-p"
                [disabled]="ocupado() === a.id"
                [attr.aria-label]="'Ver ' + a.nome"
                (click)="abrir(a, 'ver')"
              >
                Ver
              </button>
            }
            <button
              type="button"
              class="bt bt-primario bt-p"
              [disabled]="ocupado() === a.id"
              [attr.aria-label]="'Baixar ' + a.nome"
              (click)="abrir(a, 'baixar')"
            >
              {{ ocupado() === a.id ? 'Abrindo...' : 'Baixar' }}
            </button>
            @if (removivel()) {
              <button
                type="button"
                class="bt bt-perigo bt-p"
                [attr.aria-label]="'Tirar ' + a.nome"
                (click)="confirmarRemocao(a)"
              >
                Tirar
              </button>
            }
          </span>
        </li>
      }
    </ul>
  `,
  styles: `
    .anexos {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid var(--cor-linha);
      border-radius: 12px;
      background: #fff;
    }

    .icone {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: #fde8e8;
      color: #b42318;
      font-size: 13px;
      font-weight: 800;
    }

    .icone.png,
    .icone.jpg {
      background: #e8f3ff;
      font-size: 20px;
    }

    .icone.doc,
    .icone.docx {
      background: #e8effe;
      color: #1d4ed8;
      font-size: 18px;
    }

    .info {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
    }

    .info strong {
      overflow: hidden;
      color: var(--cor-titulo);
      font-size: 15px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .info small {
      font-size: 13px;
    }

    .acoes {
      display: flex;
      flex: none;
      gap: 6px;
    }

    @media (max-width: 600px) {
      li {
        flex-wrap: wrap;
      }

      .acoes {
        width: 100%;
      }

      .acoes .bt {
        flex: 1;
      }
    }
  `,
})
export class AnexosLista {
  private dialogo = inject(DialogoService);

  readonly anexos = input.required<Anexo[]>();
  /** Busca o arquivo (rota do professor ou do aluno). */
  readonly baixar = input.required<(a: Anexo) => Observable<Blob>>();
  readonly removivel = input(false);
  readonly remover = output<Anexo>();

  readonly ocupado = signal<number | null>(null);
  readonly rotulo = (a: Anexo) => ROTULO[a.tipo] ?? 'Arquivo';
  readonly tamanho = tamanhoLegivel;
  readonly visualizavel = (a: Anexo) => ANEXO_VISUALIZAVEL.includes(a.tipo);

  abrir(a: Anexo, modo: 'ver' | 'baixar'): void {
    // A aba e aberta ja no clique (senao o navegador bloqueia como pop-up).
    const aba = modo === 'ver' ? window.open('', '_blank') : null;
    this.ocupado.set(a.id);
    this.baixar()(a).subscribe({
      next: (blob) => {
        this.ocupado.set(null);
        const url = URL.createObjectURL(blob);
        if (aba) {
          aba.location.href = url;
        } else {
          const link = document.createElement('a');
          link.href = url;
          link.download = a.nome;
          link.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      },
      error: () => {
        this.ocupado.set(null);
        aba?.close();
        this.dialogo.avisar('Não foi possível abrir o arquivo agora.', 'erro');
      },
    });
  }

  async confirmarRemocao(a: Anexo): Promise<void> {
    const sim = await this.dialogo.confirmar({
      titulo: 'Tirar o arquivo da tarefa?',
      mensagem: `"${a.nome}" deixa de aparecer para os alunos.`,
      confirmar: 'Sim, tirar',
      perigo: true,
    });
    if (sim) this.remover.emit(a);
  }
}

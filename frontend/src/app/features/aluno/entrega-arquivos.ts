import { Component, effect, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ANEXO_EXTENSOES,
  ANEXO_TAMANHO_MAXIMO,
  ARQUIVOS_POR_ENTREGA,
  Anexo,
} from '../../core/model/anexo.model';
import { PainelAlunoService } from '../../core/services/painel-aluno.service';
import { DialogoService } from '../../core/services/dialogo.service';
import { mensagemDeErro } from '../../core/util/mensagem-erro';
import { AnexosLista } from '../../shared/anexos/anexos-lista';

/**
 * "Mostre sua tarefa feita": o aluno tira uma foto (no celular abre a camera)
 * ou escolhe um documento e envia para a professora. Ate 3 por tarefa.
 * Sem a lista inicial, busca a tarefa (tela "Missao cumprida").
 */
@Component({
  selector: 'app-entrega-arquivos',
  imports: [AnexosLista],
  template: `
    <section class="entrega" aria-labelledby="titulo-entrega">
      <h2 id="titulo-entrega">📷 Mostre sua tarefa feita</h2>
      @if (arquivos().length) {
        <p>{{ bloqueado() ? 'Você enviou:' : 'Enviado para a professora:' }}</p>
        <app-anexos-lista
          [anexos]="arquivos()"
          [baixar]="baixar"
          [removivel]="!bloqueado()"
          avisoRemocao="deixa de aparecer para a professora."
          (remover)="remover($event)"
        />
      } @else {
        <p>Fez no caderno ou numa folha? Tire uma foto ou envie o arquivo (opcional).</p>
      }

      @if (erro()) {
        <p class="alerta-erro" role="alert">{{ erro() }}</p>
      }

      @if (!bloqueado() && arquivos().length < maximo) {
        <div class="botoes">
          <label class="bt-envio" [class.ocupado]="enviando()">
            <span aria-hidden="true">📷</span> Tirar foto
            <input
              type="file"
              accept="image/png,image/jpeg"
              capture="environment"
              [disabled]="enviando()"
              (change)="escolher($event)"
            />
          </label>
          <label class="bt-envio" [class.ocupado]="enviando()">
            <span aria-hidden="true">📄</span> Escolher arquivo
            <input
              type="file"
              multiple
              [accept]="extensoes"
              [disabled]="enviando()"
              (change)="escolher($event)"
            />
          </label>
        </div>
        <small class="dica">
          {{ enviando() ? 'Enviando...' : 'Foto (PNG ou JPG), PDF ou Word, até 10 MB.' }}
        </small>
      }
    </section>
  `,
  styles: `
    .entrega {
      padding: 16px 18px 18px;
      border: 1px solid var(--cor-linha);
      border-radius: var(--raio-cartao);
      background: #fff;
      box-shadow: var(--sombra-cartao);
    }

    .entrega h2 {
      margin: 0 0 6px;
      font-size: 18px;
    }

    .entrega p {
      margin: 0 0 12px;
    }

    .botoes {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 12px;
    }

    label.bt-envio {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 50px;
      padding: 0 18px;
      border: 1px solid var(--cor-texto);
      border-radius: 10px;
      background: #e8effe;
      color: var(--cor-texto);
      font-size: 20px;
      font-weight: 700;
      cursor: pointer;
    }

    label.bt-envio:hover {
      border-color: var(--cor-primaria);
      background: #fff;
    }

    label.bt-envio:focus-within {
      box-shadow: var(--anel-foco);
    }

    label.ocupado {
      opacity: 0.6;
      pointer-events: none;
    }

    /* O input fica invisivel sobre o botao (continua acessivel pelo teclado). */
    input[type='file'] {
      position: absolute;
      inset: 0;
      opacity: 0;
      cursor: pointer;
    }

    .dica {
      display: block;
      margin-top: 8px;
      font-size: 14px;
    }
  `,
})
export class EntregaArquivos {
  private service = inject(PainelAlunoService);
  private dialogo = inject(DialogoService);

  readonly tarefaId = input.required<number>();
  /** Lista ja carregada (tela da tarefa). Sem ela, busca. */
  readonly inicial = input<Anexo[] | undefined>(undefined);
  readonly mudou = output<Anexo[]>();
  /** Tarefa ja entregue: so ver, sem enviar nem tirar. */
  readonly bloqueado = input(false);

  readonly arquivos = signal<Anexo[]>([]);
  readonly enviando = signal(false);
  readonly erro = signal('');
  readonly maximo = ARQUIVOS_POR_ENTREGA;
  readonly extensoes = ANEXO_EXTENSOES;
  readonly baixar = (a: Anexo) => this.service.baixarArquivo(this.tarefaId(), a.id);

  constructor() {
    effect(() => {
      const lista = this.inicial();
      if (lista) {
        this.arquivos.set(lista);
        return;
      }
      this.service.tarefa(this.tarefaId()).subscribe({
        next: (res) => this.arquivos.set(res.data.arquivosEnviados ?? []),
      });
    });
  }

  escolher(evento: Event): void {
    const campo = evento.target as HTMLInputElement;
    const escolhidos = Array.from(campo.files ?? []);
    campo.value = '';
    if (!escolhidos.length) return;
    this.erro.set('');

    const grande = escolhidos.find((a) => a.size > ANEXO_TAMANHO_MAXIMO);
    if (grande) {
      this.erro.set(`"${grande.name}" é grande demais (até 10 MB).`);
      return;
    }
    if (this.arquivos().length + escolhidos.length > this.maximo) {
      this.erro.set(`Você pode enviar até ${this.maximo} arquivos nesta tarefa.`);
      return;
    }

    this.enviando.set(true);
    this.service.enviarArquivos(this.tarefaId(), escolhidos).subscribe({
      next: (res) => {
        this.enviando.set(false);
        this.atualizar(res.data);
        this.dialogo.avisar('Enviado para a professora!', 'sucesso');
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(mensagemDeErro(e, 'Não foi possível enviar agora. Tente de novo.'));
      },
    });
  }

  remover(a: Anexo): void {
    this.service.removerArquivo(this.tarefaId(), a.id).subscribe({
      next: (res) => this.atualizar(res.data),
      error: (e: HttpErrorResponse) =>
        this.erro.set(mensagemDeErro(e, 'Não foi possível tirar o arquivo agora.')),
    });
  }

  private atualizar(lista: Anexo[]): void {
    this.arquivos.set(lista);
    this.mudou.emit(lista);
  }
}

import { Component, inject, input, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Familia, FamiliaCriada } from '../../../core/model/painel-escola.model';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { EscolhaFamilia, ModoFamilia } from '../escolha-familia/escolha-familia';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Janela "Vincular família" no perfil do aluno (familia existente ou nova). */
@Component({
  selector: 'app-vincular-familia',
  imports: [EscolhaFamilia],
  template: `
    <div class="fundo" (click)="fechar.emit(null)">
      <form
        class="janela"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-vincular"
        (click)="$event.stopPropagation()"
        (submit)="$event.preventDefault(); salvar()"
      >
        <h2 id="titulo-vincular">Vincular família a {{ alunoNome().split(' ')[0] }}</h2>
        <app-escolha-familia
          [permitirNenhuma]="false"
          [(modo)]="modo"
          [(familia)]="familia"
          [(nome)]="nome"
          [(email)]="email"
          [(telefone)]="telefone"
          [(parentesco)]="parentesco"
          [erros]="erros()"
        />
        @if (erro()) {
          <p class="alerta-erro" role="alert">{{ erro() }}</p>
        }
        <div class="acoes">
          <button type="button" class="bt bt-secundario" (click)="fechar.emit(null)">
            Cancelar
          </button>
          <button type="submit" class="bt bt-primario" [disabled]="salvando()">
            {{ salvando() ? 'Vinculando...' : 'Vincular' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styleUrl: '../turma-detalhe/adicionar-alunos.css',
})
export class VincularFamilia {
  private service = inject(PainelEscolaService);

  alunoId = input.required<number>();
  alunoNome = input.required<string>();
  /** null = cancelou. */
  fechar = output<FamiliaCriada | null>();

  modo: ModoFamilia = 'existente';
  familia: Familia | null = null;
  nome = '';
  email = '';
  telefone = '';
  parentesco = '';

  readonly erros = signal<{ respNome?: string; respEmail?: string; familia?: string }>({});
  readonly erro = signal('');
  readonly salvando = signal(false);

  salvar(): void {
    const e: { respNome?: string; respEmail?: string; familia?: string } = {};
    if (this.modo === 'existente' && !this.familia) e.familia = 'Escolha a família na lista.';
    if (this.modo === 'nova') {
      if (!this.nome.trim()) e.respNome = 'Informe o nome do responsável.';
      if (!EMAIL.test(this.email.trim())) e.respEmail = 'Informe um e-mail válido.';
    }
    this.erros.set(e);
    if (Object.keys(e).length) return;

    this.salvando.set(true);
    this.erro.set('');
    const pedido =
      this.modo === 'existente'
        ? { responsavelId: this.familia!.id }
        : {
            responsavel: {
              nomeCompleto: this.nome.trim(),
              email: this.email.trim(),
              telefone: this.telefone.trim() || undefined,
              parentesco: this.parentesco || undefined,
            },
          };
    this.service.vincularFamilia(this.alunoId(), pedido).subscribe({
      next: (res) => this.fechar.emit(res.data),
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(err, 'Não foi possível vincular a família.'));
      },
    });
  }
}

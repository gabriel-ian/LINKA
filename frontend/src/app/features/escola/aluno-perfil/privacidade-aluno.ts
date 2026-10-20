import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { SituacaoLgpd } from '../../../core/model/painel-escola.model';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { baixarJson, nomeDeArquivo } from '../../../core/util/baixar-json';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';

/**
 * Bloco "Privacidade (LGPD)" do perfil do aluno: pedido de exclusao da
 * familia, copia dos dados, exclusao e quem enviou ou baixou o laudo.
 */
@Component({
  selector: 'app-privacidade-aluno',
  imports: [FormsModule],
  template: `
    <section class="cartao bloco privacidade">
      <h2>Privacidade (LGPD)</h2>

      @if (situacao()?.pedidoExclusao; as p) {
        <p class="aviso-caixa laranja" role="status">
          <span>
            <b>{{ p.quem ?? 'A família' }}</b> pediu a exclusão dos dados deste aluno em
            {{ data(p.criadoEm) }}. Confira com a família e apague os dados abaixo.
          </span>
        </p>
      }

      <div class="acoes-lgpd">
        <button type="button" class="bt bt-secundario bt-p" (click)="baixar()">
          Baixar dados do aluno
        </button>
        <button type="button" class="bt bt-perigo bt-p" (click)="apagando.set(true)">
          Apagar dados do aluno
        </button>
      </div>

      <h3>Laudo: envios e downloads</h3>
      <ul class="historico">
        @for (h of situacao()?.acessosAoLaudo ?? []; track $index) {
          <li>
            {{ h.acao === 'envio' ? 'Enviado' : 'Baixado' }} por
            {{ h.quem ?? 'usuário removido' }} em {{ data(h.criadoEm) }}
          </li>
        } @empty {
          <li class="vazio">Nenhum registro ainda.</li>
        }
      </ul>

      @if (erro()) {
        <p class="alerta-erro" role="alert">{{ erro() }}</p>
      }
    </section>

    @if (apagando()) {
      <div class="fundo" (click)="apagando.set(false)">
        <form
          class="janela"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-apagar"
          (click)="$event.stopPropagation()"
          (ngSubmit)="apagar()"
        >
          <h2 id="titulo-apagar">Apagar os dados de {{ nome() }}?</h2>
          <p>
            Saem da Linka o nome, o CGM, a data de nascimento, os diagnósticos, o laudo, o perfil de
            aprendizagem, o login do aluno, os recados e o vínculo com a família. Fica só um
            registro anônimo com o andamento das tarefas, para os números da turma.
            <b>Não dá para desfazer.</b>
          </p>
          <label class="campo-p">
            Para confirmar, digite o nome completo do aluno
            <input name="confirmacao" autocomplete="off" [(ngModel)]="confirmacao" />
          </label>
          @if (erroApagar()) {
            <p class="alerta-erro" role="alert">{{ erroApagar() }}</p>
          }
          <div class="acoes">
            <button type="button" class="bt bt-secundario" (click)="apagando.set(false)">
              Cancelar
            </button>
            <button
              type="submit"
              class="bt bt-perigo-cheio"
              [disabled]="
                salvando() || confirmacao.trim().toLowerCase() !== nome().trim().toLowerCase()
              "
            >
              {{ salvando() ? 'Apagando...' : 'Apagar dados' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styleUrls: ['../../../shared/senha/janela.css', './privacidade-aluno.css'],
})
export class PrivacidadeAluno implements OnInit {
  private service = inject(PainelEscolaService);
  readonly alunoId = input.required<number>();
  readonly nome = input.required<string>();
  readonly apagado = output<void>();

  readonly situacao = signal<SituacaoLgpd | null>(null);
  readonly erro = signal('');
  readonly apagando = signal(false);
  readonly salvando = signal(false);
  readonly erroApagar = signal('');
  confirmacao = '';

  ngOnInit(): void {
    this.service.lgpdDoAluno(this.alunoId()).subscribe({
      next: (res) => this.situacao.set(res.data),
      error: () => this.erro.set('Não foi possível carregar a parte de privacidade.'),
    });
  }

  data(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }

  baixar(): void {
    this.service.dadosDoAluno(this.alunoId()).subscribe({
      next: (res) => baixarJson(`dados-${nomeDeArquivo(this.nome())}.json`, res.data),
      error: () => this.erro.set('Não foi possível baixar os dados agora.'),
    });
  }

  apagar(): void {
    this.salvando.set(true);
    this.erroApagar.set('');
    this.service.anonimizarAluno(this.alunoId(), this.confirmacao).subscribe({
      next: () => {
        this.salvando.set(false);
        this.apagando.set(false);
        this.apagado.emit();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erroApagar.set(mensagemDeErro(e, 'Não foi possível apagar os dados agora.'));
      },
    });
  }
}

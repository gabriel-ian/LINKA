import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TarefaAluno, TipoAjuda } from '../../../core/model/painel-aluno.model';
import { NavegacaoService } from '../../../core/services/navegacao.service';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { VozService } from '../../../core/services/voz.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { AlunoContexto } from '../aluno-contexto';
import { tituloCompleto } from '../aluno-ui';

type Opcao = TipoAjuda | 'ouvir';

interface Dica {
  titulo: string;
  texto: string;
  pergunta?: string;
}

/** "Aluno - Preciso de ajuda" do Figma. */
@Component({
  selector: 'app-aluno-ajuda',
  imports: [],
  templateUrl: './ajuda.html',
  styleUrl: './ajuda.css',
})
export class AlunoAjuda {
  private service = inject(PainelAlunoService);
  private contexto = inject(AlunoContexto);
  readonly voz = inject(VozService);
  private navegacao = inject(NavegacaoService);

  readonly tarefaId: number;
  readonly passo: number;
  readonly tarefa = signal<TarefaAluno | null>(null);
  readonly escolhida = signal<Opcao | null>(null);
  readonly dica = signal<Dica | null>(null);
  readonly pensando = signal(false);
  readonly erro = signal('');

  readonly titulo = computed(() => {
    const t = this.tarefa();
    return t ? tituloCompleto(t) : '';
  });

  readonly textoPasso = computed(() => this.tarefa()?.passos[this.passo - 1] ?? '');

  readonly professora = computed(() => {
    const nome = this.tarefa()?.professor;
    return nome ? `Profª ${nome.split(' ').slice(0, 2).join(' ')}` : 'A professora';
  });

  constructor() {
    const rota = inject(ActivatedRoute).snapshot;
    this.tarefaId = Number(rota.paramMap.get('id'));
    this.passo = Math.max(1, Number(rota.queryParamMap.get('passo')) || 1);
    this.contexto.fala.set('Tudo bem pedir ajuda! Escolha o que vai te ajudar.');

    this.service.tarefa(this.tarefaId).subscribe({
      next: (res) => this.tarefa.set(res.data),
      error: () => this.erro.set('Não foi possível abrir a tarefa agora.'),
    });
  }

  escolher(opcao: Opcao): void {
    if (this.pensando()) return;
    this.escolhida.set(opcao);
    this.erro.set('');

    if (opcao === 'ouvir') {
      this.voz.falar(`Passo ${this.passo}. ${this.textoPasso()}`, true);
      this.dica.set({ titulo: 'O Dino leu o passo devagar', texto: this.textoPasso() });
      return;
    }

    this.pensando.set(true);
    this.dica.set(null);
    this.service.ajuda(this.tarefaId, opcao, this.passo).subscribe({
      next: (res) => {
        this.pensando.set(false);
        const r = res.data;
        if (opcao === 'professora') {
          this.dica.set({
            titulo: 'Pedido enviado!',
            texto: `${this.professora()} vai ver que você precisa de ajuda no passo ${this.passo}. Enquanto isso, tente ouvir o passo de novo.`,
          });
          return;
        }
        this.dica.set({ titulo: 'Dica do Dino', texto: r.texto ?? '', pergunta: r.pergunta });
        if (this.contexto.resumo()?.preferencias.ouvirVoz)
          this.voz.falar(`${r.texto ?? ''} ${r.pergunta ?? ''}`);
      },
      error: (e: HttpErrorResponse) => {
        this.pensando.set(false);
        this.erro.set(
          mensagemDeErro(
            e,
            'O Dino não conseguiu responder agora. Tente de novo ou avise a professora.',
          ),
        );
      },
    });
  }

  /** "Ainda nao entendi": tenta a proxima forma de ajuda. */
  aindaNaoEntendi(): void {
    const ia = this.tarefa()?.iaDisponivel;
    const ordem: Opcao[] = ia
      ? ['explicar', 'exemplo', 'ouvir', 'professora']
      : ['ouvir', 'professora'];
    const atual = this.escolhida();
    const proxima = ordem[(atual ? ordem.indexOf(atual) + 1 : 0) % ordem.length];
    this.escolher(proxima);
  }

  ouvirDica(): void {
    const d = this.dica();
    if (d) this.voz.falar(`${d.texto} ${d.pergunta ?? ''}`);
  }

  voltar(): void {
    const t = this.tarefa();
    this.navegacao.voltar(t ? `/aluno/tarefas/${t.id}` : '/aluno/tarefas');
  }
}

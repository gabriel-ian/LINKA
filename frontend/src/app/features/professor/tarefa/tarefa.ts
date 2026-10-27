import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { PainelProfessorService } from '../../../core/services/painel-professor.service';
import { EntregaAluno, TarefaProfessor } from '../../../core/model/painel-professor.model';
import { NavegacaoService } from '../../../core/services/navegacao.service';
import { DialogoService } from '../../../core/services/dialogo.service';
import { AnexosLista } from '../../../shared/anexos/anexos-lista';
import { Anexo } from '../../../core/model/anexo.model';
import { ProfessorContexto } from '../professor-contexto';
import { hojeIso } from '../../adm/escola-ui';
import { dataCurta, primeiroNome } from '../professor-ui';

/** "Professor - Tarefa criada" do Figma: original x versao adaptada por aluno. */
@Component({
  selector: 'app-professor-tarefa',
  imports: [FormsModule, RouterLink, DatePipe, AnexosLista],
  templateUrl: './tarefa.html',
  styleUrl: './tarefa.css',
})
export class ProfessorTarefa {
  private service = inject(PainelProfessorService);
  readonly contexto = inject(ProfessorContexto);
  private router = inject(Router);
  private navegacao = inject(NavegacaoService);
  private dialogo = inject(DialogoService);
  readonly baixarAnexo = (a: Anexo) => this.service.baixarAnexo(this.tarefa()!.id, a.id);

  readonly primeiroNome = primeiroNome;

  readonly tarefa = signal<TarefaProfessor | null>(null);
  readonly nova = signal(false);
  readonly selecionado = signal<number | null>(null);
  readonly gerando = signal(false);
  readonly erroIa = signal('');
  readonly erro = signal('');
  readonly editando = signal(false);
  readonly salvando = signal(false);
  textoEdicao = '';

  readonly copiando = signal(false);
  readonly turmasCopia = signal<number[]>([]);
  readonly excluindo = signal(false);
  /** Aluno cuja entrega esta aberta (resposta, arquivos e comentario). */
  readonly respostaAberta = signal<number | null>(null);
  textoComentario = '';
  readonly salvandoComentario = signal(false);
  readonly sugestoesComentario = [
    'Muito bem! Parabéns pelo capricho.',
    'Quase lá! Confira de novo o último exercício.',
    'Na próxima, leia cada passo com calma.',
  ];
  readonly baixarEntrega = (alunoId: number) => (a: Anexo) =>
    this.service.baixarEntrega(this.tarefa()!.id, alunoId, a.id);

  readonly outrasTurmas = computed(() =>
    (this.contexto.dados()?.turmas ?? []).filter((t) => t.id !== this.tarefa()?.turmaId),
  );

  readonly contagem = computed(() => {
    const e = this.tarefa()?.entregas ?? [];
    return {
      feitas: e.filter((x) => x.situacao === 'concluida').length,
      andamento: e.filter((x) => x.situacao === 'em-andamento').length,
      pendentes: e.filter((x) => x.situacao === 'pendente').length,
      respostas: e.filter((x) => x.respostaEm || x.arquivos?.length).length,
    };
  });

  readonly adaptacao = computed(() => {
    const t = this.tarefa();
    return t?.adaptacoes.find((a) => a.alunoId === this.selecionado()) ?? t?.adaptacoes[0] ?? null;
  });

  readonly geradas = computed(
    () => this.tarefa()?.adaptacoes.filter((a) => a.passos?.length).length ?? 0,
  );

  readonly prazo = computed(() => {
    const t = this.tarefa();
    if (!t?.dataEntrega) return 'sem prazo';
    const dia = t.dataEntrega === hojeIso() ? 'hoje' : `em ${dataCurta(t.dataEntrega)}`;
    return `entrega ${dia}${t.horaLimite ? ' às ' + Number(t.horaLimite.slice(0, 2)) + 'h' + (t.horaLimite.endsWith('00') ? '' : t.horaLimite.slice(3)) : ''}`;
  });

  constructor() {
    const rota = inject(ActivatedRoute);
    rota.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((p) => {
      const q = rota.snapshot.queryParamMap;
      this.nova.set(q.get('nova') === '1');
      const copias = Number(q.get('copias'));
      if (copias)
        this.dialogo.avisar(
          `A mesma tarefa também foi criada para ${copias === 1 ? 'mais 1 turma' : 'mais ' + copias + ' turmas'}.`,
        );
      const r = this.navegacao.lerRecado();
      if (r?.['editada'])
        this.dialogo.avisar(
          'Tarefa atualizada.' +
            (Number(r['refazer'])
              ? ` O enunciado mudou: ${r['refazer'] === 1 ? '1 versão adaptada vai' : r['refazer'] + ' versões adaptadas vão'} ser refeitas.`
              : ''),
        );
      this.carregar(Number(p.get('id')), !!Number(r?.['refazer']));
    });
  }

  private carregar(id: number, refazer = false): void {
    this.service.tarefa(id).subscribe({
      next: (res) => {
        this.aplicar(res.data);
        const faltam = res.data.adaptacoes.some((a) => !a.passos?.length);
        // Recem-criada (ou enunciado mudou): ja pede as versoes para a IA.
        if ((this.nova() || refazer) && faltam && res.data.iaDisponivel) this.gerar();
      },
      error: (e: HttpErrorResponse) =>
        this.erro.set(
          e.status === 404 ? 'Tarefa não encontrada.' : 'Não foi possível carregar a tarefa.',
        ),
    });
  }

  private aplicar(t: TarefaProfessor): void {
    this.tarefa.set(t);
    if (this.selecionado() === null && t.adaptacoes.length)
      this.selecionado.set(t.adaptacoes[0].alunoId);
  }

  /** Pedido de mudanca para a IA na versao do aluno escolhido. */
  readonly pedindoMudanca = signal(false);
  textoPedido = '';
  readonly sugestoesMudanca = [
    'Passos mais curtos',
    'Menos passos',
    'Linguagem mais simples',
    'Use um exemplo com os interesses do aluno',
    'Explique melhor o primeiro passo',
    'Inclua uma pausa no meio',
  ];

  usarSugestaoMudanca(s: string): void {
    const atual = this.textoPedido.trim();
    if (atual.toLowerCase().includes(s.toLowerCase())) return;
    this.textoPedido = atual ? `${atual.replace(/[.;]$/, '')}; ${s.toLowerCase()}` : s;
  }

  pedirMudanca(): void {
    const a = this.adaptacao();
    const pedido = this.textoPedido.trim();
    if (!a || !pedido) return;
    this.gerar(a.alunoId, pedido);
  }

  gerar(alunoId?: number, pedido?: string): void {
    const t = this.tarefa();
    if (!t) return;
    this.gerando.set(true);
    this.erroIa.set('');
    this.service.adaptar(t.id, alunoId, pedido).subscribe({
      next: (res) => {
        this.gerando.set(false);
        this.aplicar(res.data);
        this.contexto.recarregarVisao();
        if (pedido) {
          const nome = res.data.adaptacoes.find((x) => x.alunoId === alunoId)?.nome;
          this.pedindoMudanca.set(false);
          this.textoPedido = '';
          this.dialogo.avisar(
            `A IA refez a versão${nome ? ' de ' + primeiroNome(nome) : ''} com o seu pedido.`,
          );
        }
      },
      error: (e: HttpErrorResponse) => {
        this.gerando.set(false);
        this.erroIa.set(
          `${mensagemDeErro(e, 'A IA não respondeu.')} Você pode escrever os passos manualmente em "Editar adaptação".`,
        );
      },
    });
  }

  voltar(): void {
    this.navegacao.voltar(this.nova() ? '/professor' : '/professor/tarefas');
  }

  alternarCopia(id: number, marcada: boolean): void {
    this.turmasCopia.update((ids) =>
      marcada ? [...new Set([...ids, id])] : ids.filter((i) => i !== id),
    );
  }

  copiar(): void {
    const t = this.tarefa();
    const turmas = this.turmasCopia();
    if (!t || !turmas.length) return;
    this.salvando.set(true);
    this.erro.set('');
    this.service.copiarTarefa(t.id, turmas).subscribe({
      next: (res) => {
        this.salvando.set(false);
        this.copiando.set(false);
        this.turmasCopia.set([]);
        this.contexto.recarregarVisao();
        const nomes = (this.contexto.dados()?.turmas ?? [])
          .filter((x) => turmas.includes(x.id))
          .map((x) => x.nome)
          .join(', ');
        this.dialogo.avisar(
          `Tarefa copiada para ${nomes}. ${res.data.ids.length === 1 ? 'A cópia já está' : 'As cópias já estão'} com os alunos.`,
        );
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(e, 'Não foi possível copiar a tarefa.'));
      },
    });
  }

  async excluir(): Promise<void> {
    const t = this.tarefa();
    if (!t) return;
    const c = this.contagem();
    const comecaram = c.feitas + c.andamento;
    const sim = await this.dialogo.confirmar({
      titulo: `Excluir "${t.titulo}"?`,
      mensagem:
        `A tarefa some para os alunos e famílias da ${t.turma}.` +
        (comecaram
          ? ` ${comecaram === 1 ? '1 aluno já começou ou terminou' : comecaram + ' alunos já começaram ou terminaram'} e vai perder esse registro.`
          : '') +
        ' Não dá para desfazer.',
      confirmar: 'Sim, excluir',
      perigo: true,
    });
    if (!sim) return;
    this.excluindo.set(true);
    this.service.excluirTarefa(t.id).subscribe({
      next: () => {
        this.contexto.recarregarVisao();
        this.router.navigate(['/professor/tarefas'], { replaceUrl: true });
      },
      error: (e: HttpErrorResponse) => {
        this.excluindo.set(false);
        this.erro.set(mensagemDeErro(e, 'Não foi possível excluir a tarefa.'));
      },
    });
  }

  escolher(alunoId: number): void {
    this.selecionado.set(alunoId);
    this.editando.set(false);
    this.pedindoMudanca.set(false);
  }

  editar(): void {
    this.textoEdicao = (this.adaptacao()?.passos ?? []).join('\n');
    this.editando.set(true);
  }

  salvarEdicao(): void {
    const t = this.tarefa();
    const a = this.adaptacao();
    const passos = this.textoEdicao
      .split('\n')
      .map((p) => p.replace(/^\s*\d+[.)-]\s*/, '').trim())
      .filter(Boolean);
    if (!t || !a || !passos.length) return;

    this.salvando.set(true);
    this.service.editarAdaptacao(t.id, a.alunoId, passos).subscribe({
      next: (res) => {
        this.salvando.set(false);
        this.editando.set(false);
        this.aplicar(res.data);
      },
      error: () => {
        this.salvando.set(false);
        this.erroIa.set('Não foi possível salvar a adaptação.');
      },
    });
  }

  /** Professor pode abrir a entrega de quem terminou ou mandou algo. */
  temEntrega(e: EntregaAluno): boolean {
    return e.situacao === 'concluida' || !!e.resposta || !!e.arquivos?.length;
  }

  abrirEntrega(e: EntregaAluno): void {
    const aberta = this.respostaAberta() === e.alunoId;
    this.respostaAberta.set(aberta ? null : e.alunoId);
    this.textoComentario = aberta ? '' : (e.comentario ?? '');
  }

  usarSugestaoComentario(s: string): void {
    this.textoComentario = this.textoComentario.trim()
      ? `${this.textoComentario.trim()} ${s}`
      : s;
  }

  salvarComentario(e: EntregaAluno): void {
    const t = this.tarefa();
    if (!t || this.salvandoComentario()) return;
    this.salvandoComentario.set(true);
    this.service.comentarEntrega(t.id, e.alunoId, this.textoComentario).subscribe({
      next: (res) => {
        this.salvandoComentario.set(false);
        const comentario = res.data.comentario;
        this.tarefa.set({
          ...t,
          entregas: t.entregas.map((x) =>
            x.alunoId === e.alunoId
              ? { ...x, comentario, comentarioEm: comentario ? new Date().toISOString() : null }
              : x,
          ),
        });
        this.dialogo.avisar(
          comentario
            ? `Comentário enviado para ${primeiroNome(e.nome)} e a família.`
            : 'Comentário apagado.',
        );
      },
      error: (err: HttpErrorResponse) => {
        this.salvandoComentario.set(false);
        this.dialogo.avisar(mensagemDeErro(err, 'Não foi possível salvar o comentário.'), 'erro');
      },
    });
  }
}

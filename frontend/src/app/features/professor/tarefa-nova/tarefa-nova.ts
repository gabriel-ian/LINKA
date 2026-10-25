import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { PainelProfessorService } from '../../../core/services/painel-professor.service';
import { AlunoDaTurma } from '../../../core/model/painel-professor.model';
import { EditorTexto, temTexto } from '../../../shared/editor-texto/editor-texto';
import { NavegacaoService } from '../../../core/services/navegacao.service';
import { ProfessorContexto } from '../professor-contexto';
import { hojeIso } from '../../adm/escola-ui';
import { corDaSituacao, iniciaisPessoa } from '../../escola/escola-ui';
import { primeiroNome } from '../professor-ui';
import { Esqueleto } from '../../../shared/esqueleto/esqueleto';

type Campo = 'titulo' | 'descricao' | 'disciplina' | 'turma' | 'data';

/** "Professor - Criar tarefa" do Figma. Com :id na rota, edita a tarefa. */
@Component({
  selector: 'app-professor-tarefa-nova',
  imports: [Esqueleto, FormsModule, EditorTexto],
  templateUrl: './tarefa-nova.html',
  styleUrl: './tarefa-nova.css',
})
export class ProfessorTarefaNova {
  private service = inject(PainelProfessorService);
  private router = inject(Router);
  private navegacao = inject(NavegacaoService);
  readonly contexto = inject(ProfessorContexto);

  readonly iniciais = iniciaisPessoa;
  readonly primeiroNome = primeiroNome;
  readonly corSituacao = corDaSituacao;
  readonly hoje = hojeIso();

  /** Tarefa sendo editada (null = criando). */
  readonly editandoId = signal<number | null>(null);
  readonly carregando = signal(false);
  /** Data original: ao editar, uma entrega que ja passou continua valendo. */
  private dataOriginal = '';

  titulo = '';
  descricao = '';
  disciplinaId: number | null = null;
  dataEntrega = '';
  horaLimite = '18:00';
  readonly turmaId = signal<number | null>(null);
  /** Outras turmas que recebem a mesma tarefa. */
  readonly outrasTurmas = signal<number[]>([]);

  readonly turmasExtras = computed(() =>
    (this.contexto.dados()?.turmas ?? []).filter((t) => t.id !== this.turmaId()),
  );

  readonly alunos = signal<AlunoDaTurma[]>([]);
  readonly nee = computed(() => this.alunos().filter((a) => a.neurodivergente));
  readonly erros = signal<Partial<Record<Campo, string>>>({});
  readonly erroGeral = signal('');
  readonly salvando = signal(false);

  constructor() {
    const id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
    if (id) this.carregar(id);

    // Turma e disciplina vem pre-selecionadas do contexto.
    effect(() => {
      const dados = this.contexto.dados();
      if (this.editandoId() !== null) return;
      if (this.turmaId() === null && this.contexto.turmaId() !== null)
        this.turmaId.set(this.contexto.turmaId());
      if (this.disciplinaId === null && dados?.disciplinas.length)
        this.disciplinaId = dados.disciplinas[0].id;
    });

    effect(() => {
      const turma = this.turmaId();
      if (turma === null) return;
      this.outrasTurmas.update((ids) => ids.filter((i) => i !== turma));
      this.service.alunos(turma).subscribe({ next: (res) => this.alunos.set(res.data.alunos) });
    });
  }

  private carregar(id: number): void {
    this.editandoId.set(id);
    this.carregando.set(true);
    this.service.tarefa(id).subscribe({
      next: (res) => {
        const t = res.data;
        this.titulo = t.titulo;
        this.descricao = t.descricao ?? '';
        this.disciplinaId = t.disciplinaId;
        this.dataEntrega = t.dataEntrega ?? '';
        this.dataOriginal = this.dataEntrega;
        this.horaLimite = t.horaLimite ?? '';
        this.turmaId.set(t.turmaId);
        this.carregando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.carregando.set(false);
        this.erroGeral.set(
          e.status === 404 ? 'Tarefa não encontrada.' : 'Não foi possível carregar a tarefa.',
        );
      },
    });
  }

  erro(c: Campo): string | undefined {
    return this.erros()[c];
  }

  alternarTurma(id: number, marcada: boolean): void {
    this.outrasTurmas.update((ids) =>
      marcada ? [...new Set([...ids, id])] : ids.filter((i) => i !== id),
    );
  }

  cancelar(): void {
    const id = this.editandoId();
    this.navegacao.voltar(id ? `/professor/tarefas/${id}` : '/professor/tarefas');
  }

  salvar(): void {
    const e: Partial<Record<Campo, string>> = {};
    if (!this.titulo.trim()) e.titulo = 'Dê um título para a tarefa.';
    if (!temTexto(this.descricao))
      e.descricao = 'Escreva o enunciado - é a partir dele que a Linka adapta.';
    if (!this.disciplinaId) e.disciplina = 'Escolha a disciplina.';
    if (!this.turmaId()) e.turma = 'Escolha a turma.';
    if (!this.dataEntrega) e.data = 'Informe a data de entrega.';
    else if (this.dataEntrega < this.hoje && this.dataEntrega !== this.dataOriginal)
      e.data = 'A data de entrega já passou.';
    this.erros.set(e);
    if (Object.keys(e).length) return;

    this.salvando.set(true);
    this.erroGeral.set('');
    const id = this.editandoId();
    if (id) this.atualizar(id);
    else this.criar();
  }

  private criar(): void {
    this.service
      .criarTarefa({
        titulo: this.titulo.trim(),
        descricao: this.descricao,
        turmaId: this.turmaId()!,
        outrasTurmas: this.outrasTurmas(),
        disciplinaId: this.disciplinaId!,
        dataEntrega: this.dataEntrega,
        horaLimite: this.horaLimite || undefined,
      })
      .subscribe({
        next: (res) => {
          this.contexto.recarregarVisao();
          this.router.navigate(['/professor/tarefas', res.data.id], {
            queryParams: { nova: 1, copias: res.data.ids.length - 1 || null },
            replaceUrl: true,
          });
        },
        error: (err: HttpErrorResponse) => this.falhou(err, 'Não foi possível criar a tarefa.'),
      });
  }

  private atualizar(id: number): void {
    this.service
      .editarTarefa(id, {
        titulo: this.titulo.trim(),
        descricao: this.descricao,
        disciplinaId: this.disciplinaId!,
        dataEntrega: this.dataEntrega,
        horaLimite: this.horaLimite || '',
      })
      .subscribe({
        next: (res) => {
          this.contexto.recarregarVisao();
          // Volta para a tarefa (sem empilhar a tela de edicao no historico).
          this.navegacao.voltar(`/professor/tarefas/${id}`, {
            editada: 1,
            refazer: res.data.adaptacoesRefazer,
          });
        },
        error: (err: HttpErrorResponse) => this.falhou(err, 'Não foi possível salvar a tarefa.'),
      });
  }

  private falhou(err: HttpErrorResponse, padrao: string): void {
    this.salvando.set(false);
    this.erroGeral.set(mensagemDeErro(err, padrao));
  }
}

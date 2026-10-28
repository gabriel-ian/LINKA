import { Component, computed, effect, inject, signal } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import {
  Anexo,
  ANEXO_EXTENSOES,
  ANEXO_TAMANHO_MAXIMO,
  ANEXOS_POR_TAREFA,
} from '../../../core/model/anexo.model';
import { DialogoService } from '../../../core/services/dialogo.service';
import { AnexosLista, tamanhoLegivel } from '../../../shared/anexos/anexos-lista';
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
  imports: [Esqueleto, FormsModule, EditorTexto, AnexosLista],
  templateUrl: './tarefa-nova.html',
  styleUrl: './tarefa-nova.css',
})
export class ProfessorTarefaNova {
  private service = inject(PainelProfessorService);
  private router = inject(Router);
  private navegacao = inject(NavegacaoService);
  readonly contexto = inject(ProfessorContexto);
  private dialogo = inject(DialogoService);

  /** Materiais: os que ja estao na tarefa (edicao) e os escolhidos agora. */
  readonly anexos = signal<Anexo[]>([]);
  readonly novosArquivos = signal<File[]>([]);
  readonly erroArquivo = signal('');
  readonly extensoes = ANEXO_EXTENSOES;
  readonly maximo = ANEXOS_POR_TAREFA;
  readonly tamanho = tamanhoLegivel;
  readonly baixarAnexo = (a: Anexo) => this.service.baixarAnexo(this.editandoId()!, a.id);

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
  /** Orientacao para a IA ao adaptar (opcional). */
  orientacaoIa = '';
  readonly sugestoesIa = [
    'No máximo 4 passos',
    'Use exemplos do dia a dia',
    'Linguagem bem simples',
    'Inclua uma pausa no meio',
    'Use os interesses de cada aluno',
  ];
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
        this.anexos.set(t.anexos ?? []);
        this.disciplinaId = t.disciplinaId;
        this.dataEntrega = t.dataEntrega ?? '';
        this.dataOriginal = this.dataEntrega;
        this.horaLimite = t.horaLimite ?? '';
        this.orientacaoIa = t.orientacaoIa ?? '';
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

  /** Confere tipo, tamanho e limite antes de enviar (o servidor confere de novo). */
  escolherArquivos(lista: FileList | null, campo: HTMLInputElement): void {
    this.erroArquivo.set('');
    const escolhidos = Array.from(lista ?? []);
    campo.value = '';
    const aceitos: File[] = [];
    for (const f of escolhidos) {
      if (!/\.(pdf|png|jpe?g|docx?)$/i.test(f.name)) {
        this.erroArquivo.set(`${f.name}: envie PDF, imagem (PNG ou JPG) ou Word (DOC ou DOCX).`);
        continue;
      }
      if (f.size > ANEXO_TAMANHO_MAXIMO) {
        this.erroArquivo.set(`${f.name}: o limite é 10 MB por arquivo.`);
        continue;
      }
      aceitos.push(f);
    }
    const total = this.anexos().length + this.novosArquivos().length + aceitos.length;
    if (total > ANEXOS_POR_TAREFA) {
      this.erroArquivo.set(`Cada tarefa pode ter até ${ANEXOS_POR_TAREFA} arquivos.`);
      aceitos.splice(ANEXOS_POR_TAREFA - this.anexos().length - this.novosArquivos().length);
    }
    this.novosArquivos.update((l) => [...l, ...aceitos]);
  }

  /** Junta a sugestao clicada ao texto da orientacao. */
  usarSugestao(s: string): void {
    const atual = this.orientacaoIa.trim();
    if (atual.toLowerCase().includes(s.toLowerCase())) return;
    this.orientacaoIa = atual ? `${atual.replace(/[.;]$/, '')}; ${s.toLowerCase()}` : s;
  }

  tirarNovo(f: File): void {
    this.novosArquivos.update((l) => l.filter((x) => x !== f));
  }

  /** Tira na hora um arquivo que ja estava na tarefa (edicao). */
  removerAnexo(a: Anexo): void {
    const id = this.editandoId();
    if (!id) return;
    this.service.removerAnexo(id, a.id).subscribe({
      next: (res) => {
        this.anexos.set(res.data);
        this.dialogo.avisar('Arquivo tirado da tarefa.');
      },
      error: () => this.dialogo.avisar('Não foi possível tirar o arquivo.', 'erro'),
    });
  }

  /** Envia os arquivos novos para cada tarefa criada (uma por turma). */
  private enviarArquivos(ids: number[]): Observable<unknown> {
    const arquivos = this.novosArquivos();
    if (!arquivos.length) return of(null);
    return forkJoin(ids.map((id) => this.service.anexar(id, arquivos)));
  }

  private avisarFalhaArquivos(err: HttpErrorResponse): void {
    this.dialogo.avisar(
      mensagemDeErro(
        err,
        'A tarefa foi salva, mas os arquivos não foram enviados. Tente de novo pela edição.',
      ),
      'erro',
      8000,
    );
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

  async salvar(): Promise<void> {
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

    const id = this.editandoId();
    if (!id && !(await this.confirmarCriacao())) return;

    this.salvando.set(true);
    this.erroGeral.set('');
    if (id) this.atualizar(id);
    else this.criar();
  }

  /** Resumo do que vai ser enviado, para a professora conferir antes. */
  private confirmarCriacao(): Promise<boolean> {
    const dados = this.contexto.dados();
    const turmas = (dados?.turmas ?? [])
      .filter((t) => t.id === this.turmaId() || this.outrasTurmas().includes(t.id))
      .map((t) => t.nome);
    const disciplina = dados?.disciplinas.find((d) => d.id === this.disciplinaId)?.nome;
    const [a, m, d] = this.dataEntrega.split('-');
    const prazo = `${d}/${m}/${a}${this.horaLimite ? ' às ' + this.horaLimite : ''}`;
    const arquivos = this.novosArquivos().length;
    const nee = this.nee().length;
    return this.dialogo.confirmar({
      titulo: `Criar "${this.titulo.trim()}"?`,
      mensagem:
        `${disciplina ? disciplina + ' · ' : ''}${turmas.join(', ')} · entrega ${prazo}.` +
        (arquivos ? ` Com ${arquivos === 1 ? '1 arquivo' : arquivos + ' arquivos'}.` : '') +
        ' A tarefa vai na hora para os alunos e as famílias' +
        (nee
          ? `, e a Linka faz a versão adaptada para ${nee === 1 ? '1 aluno NEE' : nee + ' alunos NEE'}.`
          : '.'),
      confirmar: 'Sim, criar tarefa',
      cancelar: 'Voltar e revisar',
    });
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
        orientacaoIa: this.orientacaoIa.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.contexto.recarregarVisao();
          const abrir = () =>
            this.router.navigate(['/professor/tarefas', res.data.id], {
              queryParams: { nova: 1, copias: res.data.ids.length - 1 || null },
              replaceUrl: true,
            });
          this.enviarArquivos(res.data.ids).subscribe({
            next: () => abrir(),
            error: (e: HttpErrorResponse) => {
              this.avisarFalhaArquivos(e);
              abrir();
            },
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
        orientacaoIa: this.orientacaoIa.trim(),
      })
      .subscribe({
        next: (res) => {
          this.contexto.recarregarVisao();
          // Volta para a tarefa (sem empilhar a tela de edicao no historico).
          const voltar = () =>
            this.navegacao.voltar(`/professor/tarefas/${id}`, {
              editada: 1,
              refazer: res.data.adaptacoesRefazer,
            });
          this.enviarArquivos([id]).subscribe({
            next: () => voltar(),
            error: (e: HttpErrorResponse) => {
              this.salvando.set(false);
              this.avisarFalhaArquivos(e);
            },
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

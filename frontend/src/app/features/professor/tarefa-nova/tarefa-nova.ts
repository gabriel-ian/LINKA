import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelProfessorService } from '../../../core/services/painel-professor.service';
import { AlunoDaTurma } from '../../../core/model/painel-professor.model';
import { ProfessorContexto } from '../professor-contexto';
import { hojeIso } from '../../adm/escola-ui';
import { corDaSituacao, iniciaisPessoa } from '../../escola/escola-ui';
import { primeiroNome } from '../professor-ui';

type Campo = 'titulo' | 'descricao' | 'disciplina' | 'turma' | 'data';

/** "Professor - Criar tarefa" do Figma. */
@Component({
  selector: 'app-professor-tarefa-nova',
  imports: [FormsModule],
  templateUrl: './tarefa-nova.html',
  styleUrl: './tarefa-nova.css',
})
export class ProfessorTarefaNova {
  private service = inject(PainelProfessorService);
  private router = inject(Router);
  readonly contexto = inject(ProfessorContexto);

  readonly iniciais = iniciaisPessoa;
  readonly primeiroNome = primeiroNome;
  readonly corSituacao = corDaSituacao;
  readonly hoje = hojeIso();

  titulo = '';
  descricao = '';
  disciplinaId: number | null = null;
  dataEntrega = '';
  horaLimite = '18:00';
  readonly turmaId = signal<number | null>(null);

  readonly alunos = signal<AlunoDaTurma[]>([]);
  readonly nee = computed(() => this.alunos().filter((a) => a.neurodivergente));
  readonly erros = signal<Partial<Record<Campo, string>>>({});
  readonly erroGeral = signal('');
  readonly salvando = signal(false);

  constructor() {
    // Turma e disciplina vem pre-selecionadas do contexto.
    effect(() => {
      const dados = this.contexto.dados();
      if (this.turmaId() === null && this.contexto.turmaId() !== null)
        this.turmaId.set(this.contexto.turmaId());
      if (this.disciplinaId === null && dados?.disciplinas.length)
        this.disciplinaId = dados.disciplinas[0].id;
    });

    effect(() => {
      const id = this.turmaId();
      if (id === null) return;
      this.service.alunos(id).subscribe({ next: (res) => this.alunos.set(res.data.alunos) });
    });
  }

  erro(c: Campo): string | undefined {
    return this.erros()[c];
  }

  criar(): void {
    const e: Partial<Record<Campo, string>> = {};
    if (!this.titulo.trim()) e.titulo = 'Dê um título para a tarefa.';
    if (!this.descricao.trim())
      e.descricao = 'Escreva o enunciado - é a partir dele que a Linka adapta.';
    if (!this.disciplinaId) e.disciplina = 'Escolha a disciplina.';
    if (!this.turmaId()) e.turma = 'Escolha a turma.';
    if (!this.dataEntrega) e.data = 'Informe a data de entrega.';
    else if (this.dataEntrega < this.hoje) e.data = 'A data de entrega já passou.';
    this.erros.set(e);
    if (Object.keys(e).length) return;

    this.salvando.set(true);
    this.erroGeral.set('');
    this.service
      .criarTarefa({
        titulo: this.titulo.trim(),
        descricao: this.descricao.trim(),
        turmaId: this.turmaId()!,
        disciplinaId: this.disciplinaId!,
        dataEntrega: this.dataEntrega,
        horaLimite: this.horaLimite || undefined,
      })
      .subscribe({
        next: (res) => {
          this.contexto.recarregarVisao();
          this.router.navigate(['/professor/tarefas', res.data.id], { queryParams: { nova: 1 } });
        },
        error: (err: HttpErrorResponse) => {
          this.salvando.set(false);
          this.erroGeral.set(
            [err.error?.message].flat().join(' ') || 'Não foi possível criar a tarefa.',
          );
        },
      });
  }
}

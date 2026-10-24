import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Opcoes, ProfessorEdicao } from '../../../core/model/painel-escola.model';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { EscolaContexto } from '../escola-contexto';
import { alternado } from '../escola-ui';
import {
  EscolhaTurmas,
  limparAlocacoes,
  paraAlocacoes,
} from '../cadastro-professor/escolha-turmas';
import { NavegacaoService } from '../../../core/services/navegacao.service';

/** Editar nome, disciplinas e turmas (com a disciplina de cada turma) do professor. */
@Component({
  selector: 'app-escola-professor-editar',
  imports: [FormsModule, RouterLink, EscolhaTurmas],
  templateUrl: './professor-editar.html',
  styleUrl: '../cadastro-professor/cadastro.css',
})
export class EscolaProfessorEditar {
  private service = inject(PainelEscolaService);
  private contexto = inject(EscolaContexto);
  private router = inject(Router);
  private navegacao = inject(NavegacaoService);

  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly professor = signal<ProfessorEdicao | null>(null);
  readonly opcoes = signal<Opcoes | null>(null);
  readonly extras = signal<string[]>([]);
  readonly disciplinas = signal<Set<string>>(new Set());
  readonly alocacoes = signal<Map<number, Set<string>>>(new Map());
  readonly adicionando = signal(false);
  readonly salvando = signal(false);
  readonly erro = signal('');
  readonly erroNome = signal(false);
  nome = '';
  novaDisciplina = '';

  readonly todasDisciplinas = computed(() => [
    ...new Set([
      ...(this.opcoes()?.disciplinas.map((d) => d.nome) ?? []),
      ...(this.professor()?.disciplinas ?? []),
      ...this.extras(),
    ]),
  ]);
  readonly disciplinasEscolhidas = computed(() => [...this.disciplinas()]);

  constructor() {
    this.service.opcoes().subscribe({ next: (res) => this.opcoes.set(res.data) });
    this.service.professor(this.id).subscribe({
      next: (res) => {
        const p = res.data;
        this.professor.set(p);
        this.nome = p.nome;
        this.disciplinas.set(new Set(p.disciplinas));
        this.alocacoes.set(new Map(p.alocacoes.map((a) => [a.turmaId, new Set(a.disciplinas)])));
      },
      error: (e: HttpErrorResponse) =>
        this.erro.set(
          e.status === 404 ? 'Professor não encontrado.' : 'Não foi possível abrir o professor.',
        ),
    });
  }

  alternarDisciplina(nome: string): void {
    this.disciplinas.update((s) => alternado(s, nome));
    this.alocacoes.update((m) => limparAlocacoes(m, [...this.disciplinas()]));
  }

  adicionarDisciplina(): void {
    const nome = this.novaDisciplina.trim();
    const existente = this.todasDisciplinas().find((d) => d.toLowerCase() === nome.toLowerCase());
    if (nome && !existente) this.extras.update((e) => [...e, nome]);
    const escolhida = existente ?? nome;
    if (escolhida && !this.disciplinas().has(escolhida)) this.alternarDisciplina(escolhida);
    this.novaDisciplina = '';
    this.adicionando.set(false);
  }

  salvar(): void {
    this.erroNome.set(!this.nome.trim());
    if (this.erroNome()) return;

    this.salvando.set(true);
    this.erro.set('');
    this.service
      .editarProfessor(this.id, {
        nomeCompleto: this.nome.trim(),
        disciplinas: [...this.disciplinas()],
        alocacoes: paraAlocacoes(this.alocacoes()),
      })
      .subscribe({
        next: () => {
          this.contexto.recarregar();
          this.router.navigate(['/escola/professores'], {
            queryParams: { salvo: this.id },
            replaceUrl: true,
          });
        },
        error: (e: HttpErrorResponse) => {
          this.salvando.set(false);
          this.erro.set(mensagemDeErro(e, 'Não foi possível salvar o professor.'));
        },
      });
  }

  /** Volta para a tela de onde veio; aberta direto, vai para '/escola/professores'. */
  voltar(): void {
    this.navegacao.voltar('/escola/professores');
  }
}

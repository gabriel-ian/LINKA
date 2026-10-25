import { PluralPipe } from '../../../shared/plural.pipe';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { AlunoResumo, TurmaDetalhe } from '../../../core/model/painel-escola.model';
import { EscolaContexto } from '../escola-contexto';
import { AdicionarAlunos } from './adicionar-alunos';
import {
  ROTULO_SITUACAO,
  corDaSituacao,
  corDoIndice,
  iniciaisPessoa,
  juntar,
  percentual,
} from '../escola-ui';
import { NavegacaoService } from '../../../core/services/navegacao.service';
import { DialogoService } from '../../../core/services/dialogo.service';

/** "Escola - Detalhe da turma" e "Escola - Turma sem alunos" do Figma. */
@Component({
  selector: 'app-escola-turma-detalhe',
  imports: [RouterLink, PluralPipe, AdicionarAlunos],
  templateUrl: './turma-detalhe.html',
  styleUrl: './turma-detalhe.css',
})
export class EscolaTurmaDetalhe {
  private dialogo = inject(DialogoService);
  private service = inject(PainelEscolaService);
  private navegacao = inject(NavegacaoService);

  readonly pct = percentual;
  readonly iniciais = iniciaisPessoa;
  readonly cor = corDoIndice;
  readonly corSituacao = corDaSituacao;
  readonly rotuloSituacao = ROTULO_SITUACAO;
  readonly juntar = juntar;

  readonly turma = signal<TurmaDetalhe | null>(null);
  readonly criada = signal(false);
  readonly salva = signal(false);
  readonly erro = signal('');
  readonly adicionando = signal(false);
  readonly aviso = signal('');
  private contexto = inject(EscolaContexto);

  /** Todos os alunos da turma (NEE e nao NEE), da lista da escola. */
  readonly alunosDaTurma = computed(() => {
    const id = this.turma()?.id;
    return this.contexto
      .alunos()
      .filter((a) => a.turma?.id === id)
      .sort(
        (x, y) =>
          Number(y.neurodivergente) - Number(x.neurodivergente) || x.nome.localeCompare(y.nome),
      );
  });

  constructor() {
    const rota = inject(ActivatedRoute);
    rota.paramMap.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((p) => {
      this.criada.set(rota.snapshot.queryParamMap.get('criada') === '1');
      this.salva.set(rota.snapshot.queryParamMap.get('salva') === '1');
      this.carregar(Number(p.get('id')));
    });
  }

  private carregar(id: number): void {
    this.service.turma(id).subscribe({
      next: (res) => this.turma.set(res.data),
      error: (e: HttpErrorResponse) =>
        this.erro.set(
          e.status === 404 ? 'Turma não encontrada.' : 'Não foi possível carregar a turma.',
        ),
    });
  }

  fecharAdicionar(adicionados: number): void {
    this.adicionando.set(false);
    const t = this.turma();
    if (!adicionados || !t) return;
    this.aviso.set(
      `${adicionados} ${adicionados === 1 ? 'aluno adicionado' : 'alunos adicionados'} à turma.`,
    );
    this.carregar(t.id);
  }

  async remover(a: AlunoResumo): Promise<void> {
    const t = this.turma();
    if (!t) return;
    const sim = await this.dialogo.confirmar({
      titulo: 'Tirar da turma?',
      mensagem: `${a.nome} sai da ${t.nome} e fica sem turma. As tarefas pendentes desta turma saem da lista dele.`,
      confirmar: 'Sim, tirar da turma',
      perigo: true,
    });
    if (!sim) return;
    this.service.removerDaTurma(t.id, a.id).subscribe({
      next: () => {
        this.aviso.set(`${a.nome} saiu da turma.`);
        this.contexto.recarregar();
        this.carregar(t.id);
      },
      error: () => this.erro.set('Não foi possível tirar o aluno da turma.'),
    });
  }

  nomesProfessores(t: TurmaDetalhe): string {
    return t.professores.length
      ? juntar(t.professores.map((p) => p.nome))
      : 'sem professores vinculados';
  }

  /** Volta para a tela de onde veio; aberta direto, vai para '/escola/turmas'. */
  voltar(): void {
    this.navegacao.voltar('/escola/turmas');
  }
}

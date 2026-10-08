import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { AlunoDetalhe, Opcoes } from '../../../core/model/painel-escola.model';
import { EscolaContexto } from '../escola-contexto';
import { PerfilAprendizagemForm } from '../../../shared/perfil-aprendizagem/perfil-aprendizagem';
import { hojeIso } from '../../adm/escola-ui';
import { alternado } from '../escola-ui';

const LAUDO_MAX = 10 * 1024 * 1024;
const TIPOS_LAUDO = ['application/pdf', 'image/png', 'image/jpeg'];

/** Edicao do aluno pela escola (tela nova, no visual do cadastro). */
@Component({
  selector: 'app-escola-aluno-editar',
  imports: [FormsModule, RouterLink, PerfilAprendizagemForm],
  templateUrl: './aluno-editar.html',
  styleUrls: [
    '../cadastro-professor/cadastro.css',
    '../cadastro-aluno/cadastro-aluno.css',
    './aluno-editar.css',
  ],
})
export class EscolaAlunoEditar {
  private service = inject(PainelEscolaService);
  private router = inject(Router);
  private contexto = inject(EscolaContexto);

  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly hoje = hojeIso();

  readonly aluno = signal<AlunoDetalhe | null>(null);
  readonly opcoes = signal<Opcoes | null>(null);
  readonly diagnosticos = signal<Set<number>>(new Set());
  readonly prefiroNaoInformar = signal(false);
  readonly laudo = signal<File | null>(null);
  readonly erroLaudo = signal('');
  readonly erroNome = signal(false);
  readonly erro = signal('');
  readonly salvando = signal(false);

  nome = '';
  nascimento = '';
  cgm = '';
  turmaId: number | null = null;
  readonly dificuldades = signal('');
  readonly pontosFortes = signal('');
  readonly interesses = signal<string[]>([]);

  constructor() {
    forkJoin([this.service.aluno(this.id), this.service.opcoes()]).subscribe({
      next: ([a, o]) => {
        const aluno = a.data;
        this.aluno.set(aluno);
        this.opcoes.set(o.data);
        this.nome = aluno.nome;
        this.nascimento = aluno.dataNascimento ?? '';
        this.cgm = aluno.cgm ?? '';
        this.turmaId = aluno.turma?.id ?? null;
        this.diagnosticos.set(
          new Set(
            o.data.diagnosticos.filter((d) => aluno.diagnosticos.includes(d.nome)).map((d) => d.id),
          ),
        );
        this.prefiroNaoInformar.set(aluno.neurodivergente && aluno.diagnosticos.length === 0);
        this.dificuldades.set(aluno.dificuldades ?? '');
        this.pontosFortes.set(aluno.pontosFortes ?? '');
        this.interesses.set(aluno.interesses);
      },
      error: (e: HttpErrorResponse) =>
        this.erro.set(
          e.status === 404 ? 'Aluno não encontrado.' : 'Não foi possível carregar o aluno.',
        ),
    });
  }

  alternarDiagnostico(id: number): void {
    this.prefiroNaoInformar.set(false);
    this.diagnosticos.update((s) => alternado(s, id));
  }

  alternarPrefiro(): void {
    this.prefiroNaoInformar.update((v) => !v);
    if (this.prefiroNaoInformar()) this.diagnosticos.set(new Set());
  }

  escolherLaudo(arquivos: FileList | null | undefined): void {
    const arquivo = arquivos?.[0];
    if (!arquivo) return;
    const erro = !TIPOS_LAUDO.includes(arquivo.type)
      ? 'O laudo deve ser PDF, PNG ou JPG.'
      : arquivo.size > LAUDO_MAX
        ? 'O laudo pode ter até 10 MB.'
        : '';
    this.erroLaudo.set(erro);
    this.laudo.set(erro ? null : arquivo);
  }

  salvar(): void {
    this.erroNome.set(!this.nome.trim());
    if (this.erroNome()) return;
    if (this.nascimento && this.nascimento > this.hoje) {
      this.erro.set('A data de nascimento não pode ser no futuro.');
      return;
    }

    this.salvando.set(true);
    this.erro.set('');
    this.service
      .editarAluno(this.id, {
        nomeCompleto: this.nome.trim(),
        dataNascimento: this.nascimento || null,
        cgm: this.cgm.trim() || null,
        turmaId: this.turmaId,
        diagnosticoIds: [...this.diagnosticos()],
        prefiroNaoInformar: this.prefiroNaoInformar(),
        dificuldades: this.dificuldades().trim() || null,
        pontosFortes: this.pontosFortes().trim() || null,
        interesses: this.interesses(),
      })
      .subscribe({
        next: () => {
          const laudo = this.laudo();
          if (!laudo) return this.concluir();
          this.service.enviarLaudo(this.id, laudo).subscribe({
            next: () => this.concluir(),
            error: () => this.concluir('laudo'),
          });
        },
        error: (e: HttpErrorResponse) => {
          this.salvando.set(false);
          this.erro.set(
            [e.error?.message].flat().join(' ') || 'Não foi possível salvar as alterações.',
          );
        },
      });
  }

  private concluir(aviso?: 'laudo'): void {
    this.contexto.recarregar();
    this.router.navigate(['/escola/alunos', this.id], { queryParams: { salvo: aviso ?? 1 } });
  }
}

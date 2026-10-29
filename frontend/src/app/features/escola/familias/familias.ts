import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime, startWith, switchMap } from 'rxjs';
import { Familia, SenhaGerada } from '../../../core/model/painel-escola.model';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { SenhaProvisoria } from '../../../shared/senha/senha-provisoria';
import { iniciaisPessoa } from '../escola-ui';
import { DialogoService } from '../../../core/services/dialogo.service';
import { Esqueleto } from '../../../shared/esqueleto/esqueleto';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';

const POR_PAGINA = 10;

/** Familias da escola: busca, filhos de cada uma e atalho para cadastrar outro filho. */
@Component({
  selector: 'app-escola-familias',
  imports: [Esqueleto, RouterLink, SenhaProvisoria],
  templateUrl: './familias.html',
  styleUrl: './familias.css',
})
export class EscolaFamilias {
  private dialogo = inject(DialogoService);
  private service = inject(PainelEscolaService);
  readonly iniciais = iniciaisPessoa;

  readonly familias = signal<Familia[] | null>(null);
  readonly erro = signal('');
  readonly senha = signal<(SenhaGerada & { nome: string }) | null>(null);
  readonly pagina = signal(0);
  private readonly busca = new Subject<string>();
  private termo = '';

  /** Familia em que a escola esta vinculando um aluno ja cadastrado. */
  readonly vinculando = signal<number | null>(null);
  readonly semFamilia = signal<{ id: number; nome: string; turma: string | null }[] | null>(null);
  readonly alunoEscolhido = signal<number | null>(null);
  readonly salvandoVinculo = signal(false);

  abrirVinculo(familiaId: number): void {
    if (this.vinculando() === familiaId) {
      this.vinculando.set(null);
      return;
    }
    this.vinculando.set(familiaId);
    this.alunoEscolhido.set(null);
    this.semFamilia.set(null);
    this.service.alunosSemFamilia().subscribe({
      next: (res) => this.semFamilia.set(res.data),
      error: () => {
        this.vinculando.set(null);
        this.dialogo.avisar('Não foi possível carregar os alunos.', 'erro');
      },
    });
  }

  vincular(f: Familia): void {
    const alunoId = this.alunoEscolhido();
    if (!alunoId || this.salvandoVinculo()) return;
    const aluno = this.semFamilia()?.find((a) => a.id === alunoId);
    this.salvandoVinculo.set(true);
    this.service.vincularFamilia(alunoId, { responsavelId: f.id }).subscribe({
      next: () => {
        this.salvandoVinculo.set(false);
        this.vinculando.set(null);
        this.dialogo.avisar(`${aluno?.nome ?? 'Aluno'} vinculado(a) a ${f.nome}.`);
        this.busca.next(this.termo);
      },
      error: (e) => {
        this.salvandoVinculo.set(false);
        this.dialogo.avisar(mensagemDeErro(e, 'Não foi possível vincular o aluno.'), 'erro');
      },
    });
  }

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil((this.familias()?.length ?? 0) / POR_PAGINA)),
  );
  readonly visiveis = computed(() =>
    (this.familias() ?? []).slice(this.pagina() * POR_PAGINA, (this.pagina() + 1) * POR_PAGINA),
  );

  constructor() {
    this.busca
      .pipe(
        startWith(''),
        debounceTime(250),
        switchMap((t) => this.service.familias(t)),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (res) => {
          this.familias.set(res.data);
          this.pagina.set(0);
        },
        error: () => this.erro.set('Não foi possível carregar as famílias agora.'),
      });
  }

  buscar(termo: string): void {
    this.termo = termo;
    this.busca.next(termo);
  }

  proximaPagina(): void {
    this.pagina.update((p) => (p + 1 < this.totalPaginas() ? p + 1 : 0));
  }

  async novaSenha(f: Familia): Promise<void> {
    if (
      !(await this.dialogo.confirmar({
        titulo: 'Gerar nova senha?',
        mensagem: `A senha atual de ${f.nome} deixa de funcionar. A nova senha aparece uma vez para você anotar.`,
        confirmar: 'Gerar nova senha',
      }))
    )
      return;
    this.service.redefinirSenha('responsaveis', f.id).subscribe({
      next: (res) => this.senha.set({ ...res.data, nome: f.nome }),
      error: () => this.erro.set('Não foi possível gerar a nova senha.'),
    });
  }
}

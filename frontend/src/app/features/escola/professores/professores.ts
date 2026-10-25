import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SenhaProvisoria } from '../../../shared/senha/senha-provisoria';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { ProfessorResumo, StatusProfessor } from '../../../core/model/painel-escola.model';
import { EscolaContexto } from '../escola-contexto';
import { ROTULO_STATUS_PROFESSOR, corDoIndice, iniciaisPessoa, juntar } from '../escola-ui';
import { DialogoService } from '../../../core/services/dialogo.service';

const POR_PAGINA = 6;

/** "Escola - Professores" do Figma. */
@Component({
  selector: 'app-escola-professores',
  imports: [RouterLink, SenhaProvisoria],
  templateUrl: './professores.html',
  styleUrl: './professores.css',
})
export class EscolaProfessores {
  private dialogo = inject(DialogoService);
  private service = inject(PainelEscolaService);
  readonly contexto = inject(EscolaContexto);

  readonly iniciais = iniciaisPessoa;
  readonly cor = corDoIndice;
  readonly juntar = juntar;
  readonly rotuloStatus = ROTULO_STATUS_PROFESSOR;

  readonly busca = signal('');
  readonly filtro = signal<StatusProfessor | 'todos'>('todos');
  readonly pagina = signal(0);
  readonly erro = signal('');
  readonly alterando = signal<number | null>(null);
  readonly senha = signal<{ nome: string; email: string; senha: string } | null>(null);
  /** Volta da tela "Editar professor" com ?salvo=id. */
  readonly salvo = signal(!!inject(ActivatedRoute).snapshot.queryParamMap.get('salvo'));

  readonly professores = this.contexto.professores;

  readonly contagem = computed(() => {
    const lista = this.professores();
    return {
      todos: lista.length,
      ativo: lista.filter((p) => p.status === 'ativo').length,
      pendente: lista.filter((p) => p.status === 'pendente').length,
      inativo: lista.filter((p) => p.status === 'inativo').length,
    };
  });

  readonly filtrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    return this.professores().filter(
      (p) =>
        (this.filtro() === 'todos' || p.status === this.filtro()) &&
        (!termo ||
          [p.nome, p.email ?? '', ...p.disciplinas].some((c) => c.toLowerCase().includes(termo))),
    );
  });

  readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.filtrados().length / POR_PAGINA)),
  );
  readonly visiveis = computed(() =>
    this.filtrados().slice(this.pagina() * POR_PAGINA, (this.pagina() + 1) * POR_PAGINA),
  );

  filtrar(f: StatusProfessor | 'todos'): void {
    this.filtro.set(f);
    this.pagina.set(0);
  }

  proximaPagina(): void {
    this.pagina.update((p) => (p + 1 < this.totalPaginas() ? p + 1 : 0));
  }

  async redefinirSenha(p: ProfessorResumo): Promise<void> {
    if (
      !(await this.dialogo.confirmar({
        titulo: 'Gerar nova senha?',
        mensagem: `A senha atual de ${p.nome} deixa de funcionar. A nova senha aparece uma vez para você anotar.`,
        confirmar: 'Gerar nova senha',
      }))
    )
      return;
    this.alterando.set(p.id);
    this.service.redefinirSenha('professores', p.id).subscribe({
      next: (res) => {
        this.alterando.set(null);
        this.senha.set({ nome: p.nome, email: res.data.email, senha: res.data.senhaProvisoria });
      },
      error: () => {
        this.alterando.set(null);
        this.erro.set(`Não foi possível gerar a senha de ${p.nome}.`);
      },
    });
  }

  async alternarAtivo(p: ProfessorResumo): Promise<void> {
    const ativar = p.status === 'inativo';
    const sim = await this.dialogo.confirmar(
      ativar
        ? {
            titulo: 'Reativar o acesso?',
            mensagem: `${p.nome} volta a entrar na Linka com a mesma senha.`,
            confirmar: 'Sim, reativar',
          }
        : {
            titulo: 'Desativar o acesso?',
            mensagem: `O login de ${p.nome} fica bloqueado. O histórico de tarefas e turmas é mantido.`,
            confirmar: 'Sim, desativar',
            perigo: true,
          },
    );
    if (!sim) return;

    this.alterando.set(p.id);
    this.erro.set('');
    this.service.definirProfessorAtivo(p.id, ativar).subscribe({
      next: () => {
        this.alterando.set(null);
        this.contexto.recarregar();
      },
      error: () => {
        this.alterando.set(null);
        this.erro.set(`Não foi possível alterar o acesso de ${p.nome}.`);
      },
    });
  }
}

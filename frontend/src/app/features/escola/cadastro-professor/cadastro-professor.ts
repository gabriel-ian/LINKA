import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { Opcoes, TurmaResumo } from '../../../core/model/painel-escola.model';
import { EscolaContexto } from '../escola-contexto';
import { AdmResultado } from '../../adm/resultado/resultado';
import { Etapas } from '../etapas';
import { alternado, juntar } from '../escola-ui';

type Campo = 'nome' | 'email' | 'senha' | 'confirmar';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


/** "Escola - Cadastro professor" (dados, confirmacao, sucesso, erros) do Figma. */
@Component({
  selector: 'app-escola-cadastro-professor',
  imports: [FormsModule, RouterLink, AdmResultado, Etapas],
  templateUrl: './cadastro-professor.html',
  styleUrl: './cadastro.css',
})
export class EscolaCadastroProfessor {
  private service = inject(PainelEscolaService);
  private contexto = inject(EscolaContexto);

  readonly juntar = juntar;

  nome = '';
  email = '';
  senha = '';
  confirmacao = '';
  mostrarSenha = false;
  mostrarConfirmar = false;
  novaDisciplina = '';

  readonly etapa = signal<1 | 2 | 3>(1);
  readonly opcoes = signal<Opcoes | null>(null);
  readonly turmasInfo = signal<TurmaResumo[]>([]);
  /** Disciplinas por nome: as do banco + as criadas no "+ Outra". */
  readonly extras = signal<string[]>([]);
  readonly disciplinas = signal<Set<string>>(new Set());
  readonly turmas = signal<Set<number>>(new Set());
  readonly adicionando = signal(false);
  readonly erros = signal<Partial<Record<Campo, string>>>({});
  readonly erroGeral = signal('');
  readonly salvando = signal(false);

  readonly todasDisciplinas = computed(() => [
    ...(this.opcoes()?.disciplinas.map((d) => d.nome) ?? []),
    ...this.extras(),
  ]);

  readonly disciplinasEscolhidas = computed(() => [...this.disciplinas()]);

  readonly nomesTurmas = computed(() =>
    (this.opcoes()?.turmas ?? []).filter((t) => this.turmas().has(t.id)).map((t) => t.nome),
  );

  readonly alunosNeeNasTurmas = computed(() =>
    this.turmasInfo()
      .filter((t) => this.turmas().has(t.id))
      .reduce((soma, t) => soma + t.totalNee, 0),
  );

  constructor() {
    this.service.opcoes().subscribe({ next: (res) => this.opcoes.set(res.data) });
    this.service.turmas().subscribe({ next: (res) => this.turmasInfo.set(res.data) });
  }

  alternarDisciplina(nome: string): void {
    this.disciplinas.update((s) => alternado(s, nome));
  }

  alternarTurma(id: number): void {
    this.turmas.update((s) => alternado(s, id));
  }

  adicionarDisciplina(): void {
    const nome = this.novaDisciplina.trim();
    if (nome && !this.todasDisciplinas().some((d) => d.toLowerCase() === nome.toLowerCase())) {
      this.extras.update((e) => [...e, nome]);
    }
    const existente = this.todasDisciplinas().find((d) => d.toLowerCase() === nome.toLowerCase());
    if (existente && !this.disciplinas().has(existente)) this.alternarDisciplina(existente);
    this.novaDisciplina = '';
    this.adicionando.set(false);
  }

  erro(c: Campo): string | undefined {
    return this.erros()[c];
  }

  continuar(): void {
    const e: Partial<Record<Campo, string>> = {};
    if (!this.nome.trim()) e.nome = 'Informe o nome completo.';
    if (!this.email.trim()) e.email = 'Informe o e-mail institucional.';
    else if (!EMAIL.test(this.email.trim())) e.email = 'E-mail inválido.';
    if (this.senha.length < 8) e.senha = 'A senha precisa ter pelo menos 8 caracteres.';
    else if (this.confirmacao !== this.senha) e.confirmar = 'As senhas não coincidem.';

    this.erros.set(e);
    this.erroGeral.set('');
    if (Object.keys(e).length === 0) this.etapa.set(2);
  }

  confirmarCadastro(): void {
    this.salvando.set(true);
    this.service
      .criarProfessor({
        nomeCompleto: this.nome.trim(),
        email: this.email.trim(),
        senha: this.senha,
        disciplinas: [...this.disciplinas()],
        turmaIds: [...this.turmas()],
      })
      .subscribe({
        next: () => {
          this.salvando.set(false);
          this.etapa.set(3);
          this.contexto.recarregar();
        },
        error: (err: HttpErrorResponse) => {
          this.salvando.set(false);
          this.etapa.set(1);
          const msg = [err.error?.message].flat().join(' ');
          if (/email/i.test(msg)) this.erros.set({ email: 'Este e-mail já está em uso.' });
          else this.erroGeral.set(msg || 'Não foi possível cadastrar o professor.');
        },
      });
  }

  cadastrarOutro(): void {
    this.nome = this.email = this.senha = this.confirmacao = '';
    this.disciplinas.set(new Set());
    this.turmas.set(new Set());
    this.erros.set({});
    this.etapa.set(1);
  }
}

import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { EscolaService } from '../../../core/services/escola.service';
import { Escola, EscolaDados, PlanoEscola } from '../../../core/model/escola.model';
import { EscolasStore } from '../escolas.store';
import { AdmResultado } from '../resultado/resultado';
import { EscolherEscola } from '../escolher-escola/escolher-escola';
import { cidadeUf, dataBr, separarCidadeUf } from '../escola-ui';

type Modo = 'cadastrar' | 'atualizar';
type Campo =
  | 'nome'
  | 'inep'
  | 'cidadeUf'
  | 'email'
  | 'senha'
  | 'confirmar'
  | 'limiteProfessores'
  | 'limiteAlunosNee';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Formulario "Cadastrar escola" e "Atualizar escola" do Figma (modo vem da rota). */
@Component({
  selector: 'app-escola-form',
  imports: [FormsModule, NgTemplateOutlet, RouterLink, AdmResultado, EscolherEscola],
  templateUrl: './escola-form.html',
  styleUrl: './escola-form.css',
})
export class EscolaForm {
  private service = inject(EscolaService);
  private router = inject(Router);
  readonly store = inject(EscolasStore);

  readonly modo: Modo = inject(ActivatedRoute).snapshot.data['modo'];
  readonly dataBr = dataBr;

  // Campos do formulario
  nome = '';
  inep = '';
  endereco = '';
  cidadeUf = '';
  responsavel = '';
  plano: PlanoEscola = 'institucional';
  email = '';
  telefone = '';
  senha = '';
  confirmar = '';
  limiteProfessores = '';
  limiteAlunosNee = '';
  mostrarSenha = false;
  mostrarConfirmar = false;

  readonly escola = signal<Escola | null>(null);
  /** Atualizar aberto pelo menu: ainda nao ha escola escolhida. */
  readonly semId = signal(false);
  readonly erros = signal<Partial<Record<Campo, string>>>({});
  readonly erroGeral = signal('');
  readonly salvando = signal(false);
  readonly concluido = signal<Escola | null>(null);

  readonly qtdErros = computed(() => Object.keys(this.erros()).length);

  constructor() {
    if (this.modo !== 'atualizar') return;

    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((params) => {
        const id = params.get('id');
        this.concluido.set(null);
        this.semId.set(!id);
        if (id) this.carregar(Number(id));
      });
  }

  private carregar(id: number): void {
    this.service.buscarPorId(id).subscribe({
      next: ({ data: e }) => {
        this.escola.set(e);
        this.nome = e.nome;
        this.endereco = e.endereco ?? '';
        this.cidadeUf = cidadeUf(e);
        this.responsavel = e.responsavel ?? '';
        this.plano = e.plano;
        this.email = e.email ?? '';
        this.telefone = e.telefone ?? '';
        this.limiteProfessores = e.limiteProfessores?.toString() ?? '';
        this.limiteAlunosNee = e.limiteAlunosNee?.toString() ?? '';
      },
      error: (e: HttpErrorResponse) =>
        this.erroGeral.set(
          e.status === 404 ? `Nenhuma escola com o ID #${id}.` : 'Não foi possível carregar a escola.',
        ),
    });
  }

  erro(campo: Campo): string | undefined {
    return this.erros()[campo];
  }

  private validar(): boolean {
    const e: Partial<Record<Campo, string>> = {};
    const cadastro = this.modo === 'cadastrar';

    if (!this.nome.trim()) e.nome = 'Informe o nome da escola.';
    else if (this.nome.trim().length < 3) e.nome = 'O nome precisa de ao menos 3 letras.';

    if (cadastro && this.inep.trim() && !/^\d{8}$/.test(this.inep.trim())) {
      e.inep = 'O código INEP tem 8 dígitos.';
    }

    if (this.cidadeUf.trim() && !separarCidadeUf(this.cidadeUf)) {
      e.cidadeUf = 'Use o formato Cidade - UF (ex.: Francisco Beltrão - PR).';
    }

    if (!this.email.trim()) e.email = 'Informe o e-mail institucional.';
    else if (!EMAIL.test(this.email.trim())) e.email = 'E-mail inválido.';

    if (cadastro) {
      if (this.senha.length < 8) e.senha = 'A senha precisa de no mínimo 8 caracteres.';
      if (this.confirmar !== this.senha) e.confirmar = 'As senhas não coincidem.';
    } else {
      for (const campo of ['limiteProfessores', 'limiteAlunosNee'] as const) {
        if (this[campo].trim() && !/^\d+$/.test(this[campo].trim())) {
          e[campo] = 'Use um número inteiro.';
        }
      }
    }

    this.erros.set(e);
    return Object.keys(e).length === 0;
  }

  /** Vazio vira undefined no cadastro (nao envia) e null na edicao (limpa). */
  private dados(): EscolaDados {
    const vazio = this.modo === 'cadastrar' ? undefined : null;
    const texto = (v: string) => v.trim() || vazio;
    const numero = (v: string) => (v.trim() ? Number(v) : vazio);
    const local = separarCidadeUf(this.cidadeUf);

    return {
      nome: this.nome.trim(),
      endereco: texto(this.endereco),
      cidade: local?.cidade ?? vazio,
      uf: local?.uf ?? vazio,
      responsavel: texto(this.responsavel),
      telefone: texto(this.telefone),
      plano: this.plano,
      email: this.email.trim(),
      ...(this.modo === 'atualizar'
        ? {
            limiteProfessores: numero(this.limiteProfessores),
            limiteAlunosNee: numero(this.limiteAlunosNee),
          }
        : { inep: texto(this.inep) }),
    };
  }

  salvar(): void {
    this.erroGeral.set('');
    if (!this.validar()) return;

    const escola = this.escola();
    const requisicao =
      this.modo === 'cadastrar'
        ? this.service.cadastrar({ ...this.dados(), senha: this.senha })
        : this.service.atualizar(escola!.id, this.dados());

    this.salvando.set(true);

    requisicao.subscribe({
      next: (res) => {
        this.salvando.set(false);
        this.concluido.set(res.data);
        this.store.recarregar();
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        const msg = [e.error?.message].flat().join(' ');

        if (/email/i.test(msg) && /existe/i.test(msg)) {
          this.erros.set({ email: 'Este e-mail já está em uso por outro usuário.' });
        } else {
          this.erroGeral.set(
            e.status === 400 ? `Dados recusados pelo servidor: ${msg}` : 'Não foi possível salvar agora. Tente novamente.',
          );
        }
      },
    });
  }

  cadastrarOutra(): void {
    for (const campo of ['nome', 'inep', 'endereco', 'cidadeUf', 'responsavel', 'email', 'telefone', 'senha', 'confirmar'] as const) {
      this[campo] = '';
    }
    this.plano = 'institucional';
    this.erros.set({});
    this.concluido.set(null);
  }

  cancelar(): void {
    const escola = this.escola();
    this.router.navigate(
      escola ? ['/adm/escolas/id'] : ['/adm'],
      escola ? { queryParams: { id: escola.id } } : {},
    );
  }
}

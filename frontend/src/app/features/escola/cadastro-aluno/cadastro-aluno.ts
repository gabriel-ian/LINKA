import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { AlunoCriado, NovoAluno, Opcoes } from '../../../core/model/painel-escola.model';
import { EscolaContexto } from '../escola-contexto';
import { AdmResultado } from '../../adm/resultado/resultado';
import { dataBr, hojeIso } from '../../adm/escola-ui';
import { Etapas } from '../etapas';
import { alternado, juntar } from '../escola-ui';

type Campo = 'nome' | 'email' | 'senha' | 'nascimento' | 'laudo' | 'respNome' | 'respEmail';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LAUDO_MAX = 10 * 1024 * 1024;
const TIPOS_LAUDO = ['application/pdf', 'image/png', 'image/jpeg'];

export const PARENTESCOS = ['Mãe', 'Pai', 'Avó', 'Avô', 'Tia', 'Tio', 'Responsável legal', 'Outro'];

/** "Escola - Cadastro aluno" (dados, confirmacao, sucesso) do Figma. */
@Component({
  selector: 'app-escola-cadastro-aluno',
  imports: [FormsModule, RouterLink, AdmResultado, Etapas],
  templateUrl: './cadastro-aluno.html',
  styleUrls: ['../cadastro-professor/cadastro.css', './cadastro-aluno.css'],
})
export class EscolaCadastroAluno {
  private service = inject(PainelEscolaService);
  private contexto = inject(EscolaContexto);

  readonly parentescos = PARENTESCOS;
  readonly juntar = juntar;
  readonly dataBr = dataBr;

  nome = '';
  email = '';
  senha = '';
  mostrarSenha = false;
  nascimento = '';
  cgm = '';
  turmaId: number | null =
    Number(inject(ActivatedRoute).snapshot.queryParamMap.get('turmaId')) || null;
  respNome = '';
  respEmail = '';
  respTelefone = '';
  respParentesco = '';

  readonly etapa = signal<1 | 2 | 3>(1);
  readonly opcoes = signal<Opcoes | null>(null);
  readonly diagnosticos = signal<Set<number>>(new Set());
  readonly prefiroNaoInformar = signal(false);
  readonly laudo = signal<File | null>(null);
  readonly arrastando = signal(false);
  readonly erros = signal<Partial<Record<Campo, string>>>({});
  readonly erroGeral = signal('');
  readonly salvando = signal(false);
  readonly criado = signal<AlunoCriado | null>(null);
  readonly avisoLaudo = signal('');

  readonly nomesDiagnosticos = computed(() =>
    (this.opcoes()?.diagnosticos ?? [])
      .filter((d) => this.diagnosticos().has(d.id))
      .map((d) => d.nome),
  );

  readonly nomeTurma = computed(
    () => this.opcoes()?.turmas.find((t) => t.id === Number(this.turmaId))?.nome ?? 'Sem turma',
  );

  constructor() {
    this.service.opcoes().subscribe({ next: (res) => this.opcoes.set(res.data) });
  }

  erro(c: Campo): string | undefined {
    return this.erros()[c];
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
        : undefined;

    this.erros.update((e) => ({ ...e, laudo: erro }));
    this.laudo.set(erro ? null : arquivo);
  }

  soltar(evento: DragEvent): void {
    evento.preventDefault();
    this.arrastando.set(false);
    this.escolherLaudo(evento.dataTransfer?.files);
  }

  continuar(): void {
    const e: Partial<Record<Campo, string>> = {};
    if (!this.nome.trim()) e.nome = 'Informe o nome do aluno.';
    if (this.email.trim() && !EMAIL.test(this.email.trim())) e.email = 'E-mail inválido.';
    if (this.email.trim() && this.senha.length < 8)
      e.senha = 'Com e-mail, a senha precisa de pelo menos 8 caracteres.';
    if (this.nascimento && this.nascimento > hojeIso())
      e.nascimento = 'A data não pode ser no futuro.';

    const temResponsavel = !!(
      this.respNome.trim() ||
      this.respEmail.trim() ||
      this.respTelefone.trim()
    );
    if (temResponsavel && !this.respNome.trim()) e.respNome = 'Informe o nome do responsável.';
    if (temResponsavel && !EMAIL.test(this.respEmail.trim()))
      e.respEmail = 'Informe um e-mail válido para o responsável.';

    this.erros.set({ ...e, laudo: this.erros().laudo });
    this.erroGeral.set('');
    if (Object.keys(e).length === 0) this.etapa.set(2);
  }

  private dados(): NovoAluno {
    return {
      nomeCompleto: this.nome.trim(),
      dataNascimento: this.nascimento || undefined,
      cgm: this.cgm.trim() || undefined,
      turmaId: this.turmaId ? Number(this.turmaId) : undefined,
      email: this.email.trim() || undefined,
      senha: this.email.trim() ? this.senha : undefined,
      diagnosticoIds: [...this.diagnosticos()],
      prefiroNaoInformar: this.prefiroNaoInformar(),
      responsavel: this.respNome.trim()
        ? {
            nomeCompleto: this.respNome.trim(),
            email: this.respEmail.trim(),
            telefone: this.respTelefone.trim() || undefined,
            parentesco: this.respParentesco || undefined,
          }
        : undefined,
    };
  }

  confirmarCadastro(): void {
    this.salvando.set(true);
    this.service.criarAluno(this.dados()).subscribe({
      next: (res) => {
        this.criado.set(res.data);
        this.contexto.recarregar();
        const laudo = this.laudo();
        if (!laudo) return this.concluir();

        // O aluno ja existe; se o laudo falhar, avisamos sem perder o cadastro.
        this.service.enviarLaudo(res.data.id, laudo).subscribe({
          next: () => this.concluir(),
          error: () => {
            this.avisoLaudo.set(
              'O aluno foi cadastrado, mas o laudo não foi enviado. Tente anexar de novo mais tarde.',
            );
            this.concluir();
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);
        this.etapa.set(1);
        const msg = [err.error?.message].flat().join(' ');
        if (/responsavel/i.test(msg))
          this.erros.set({ respEmail: 'Este e-mail já é usado por outro tipo de conta.' });
        else if (/email/i.test(msg)) this.erros.set({ email: 'Este e-mail já está em uso.' });
        else this.erroGeral.set(msg || 'Não foi possível cadastrar o aluno.');
      },
    });
  }

  private concluir(): void {
    this.salvando.set(false);
    this.etapa.set(3);
  }

  cadastrarOutro(): void {
    this.nome = this.email = this.senha = this.nascimento = this.cgm = '';
    this.respNome = this.respEmail = this.respTelefone = this.respParentesco = '';
    this.diagnosticos.set(new Set());
    this.prefiroNaoInformar.set(false);
    this.laudo.set(null);
    this.criado.set(null);
    this.avisoLaudo.set('');
    this.erros.set({});
    this.etapa.set(1);
  }
}

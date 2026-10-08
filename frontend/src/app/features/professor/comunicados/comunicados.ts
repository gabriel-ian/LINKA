import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelProfessorService } from '../../../core/services/painel-professor.service';
import {
  Comunicado,
  ComunicadoSalvo,
  ListaComunicados,
  TipoComunicado,
} from '../../../core/model/painel-professor.model';
import { ProfessorContexto } from '../professor-contexto';
import { AdmResultado } from '../../adm/resultado/resultado';
import { COR_TIPO, ROTULO_TIPO, quandoRelativo } from '../professor-ui';

/** "Professor - Comunicados" e "Comunicado enviado" do Figma. */
@Component({
  selector: 'app-professor-comunicados',
  imports: [FormsModule, RouterLink, AdmResultado],
  templateUrl: './comunicados.html',
  styleUrl: './comunicados.css',
})
export class ProfessorComunicados {
  private service = inject(PainelProfessorService);
  readonly contexto = inject(ProfessorContexto);

  readonly tipos = Object.keys(ROTULO_TIPO) as TipoComunicado[];
  readonly rotuloTipo = ROTULO_TIPO;
  readonly corTipo = COR_TIPO;
  readonly quando = quandoRelativo;

  rascunhoId: number | null = null;
  turmaId: number | null = null;
  tipo: TipoComunicado = 'atividade';
  titulo = '';
  mensagem = '';
  simplificada = true;

  readonly lista = signal<ListaComunicados | null>(null);
  readonly todos = signal(false);
  readonly erros = signal<{ titulo?: string; mensagem?: string }>({});
  readonly erro = signal('');
  readonly salvando = signal(false);
  readonly enviado = signal<(ComunicadoSalvo & { titulo: string }) | null>(null);
  readonly avisoRascunho = signal('');

  readonly enviados = computed(() => {
    const e = this.lista()?.enviados ?? [];
    return this.todos() ? e : e.slice(0, 3);
  });

  /** Primeiros nomes dos alunos NEE da turma escolhida (texto do Figma). */
  readonly neeTurma = computed(() =>
    this.contexto.turmaId() === this.turmaId
      ? (this.contexto.visao()?.alunosNee ?? []).map((a) => a.nome.split(' ')[0])
      : [],
  );

  constructor() {
    effect(() => {
      if (this.turmaId === null && this.contexto.turmaId() !== null)
        this.turmaId = this.contexto.turmaId();
      // Sem IA no servidor a opcao fica desmarcada (e desabilitada na tela).
      if (this.contexto.dados() && !this.contexto.dados()!.iaDisponivel) this.simplificada = false;
    });
    this.carregar();
  }

  private carregar(): void {
    this.service.comunicados().subscribe({ next: (res) => this.lista.set(res.data) });
  }

  abrirRascunho(c: Comunicado): void {
    this.rascunhoId = c.id;
    this.turmaId = c.turmaId;
    this.tipo = c.tipo;
    this.titulo = c.titulo;
    this.mensagem = c.mensagem;
    this.avisoRascunho.set('');
  }

  salvar(rascunho: boolean): void {
    const e: { titulo?: string; mensagem?: string } = {};
    if (!this.titulo.trim()) e.titulo = 'Dê um título ao comunicado.';
    if (!this.mensagem.trim()) e.mensagem = 'Escreva a mensagem.';
    this.erros.set(e);
    if (Object.keys(e).length || this.turmaId === null) return;

    this.salvando.set(true);
    this.erro.set('');
    this.service
      .salvarComunicado({
        id: this.rascunhoId ?? undefined,
        turmaId: this.turmaId,
        tipo: this.tipo,
        titulo: this.titulo.trim(),
        mensagem: this.mensagem.trim(),
        simplificada: this.simplificada,
        rascunho,
      })
      .subscribe({
        next: (res) => {
          this.salvando.set(false);
          this.carregar();
          if (rascunho) {
            this.rascunhoId = res.data.id;
            this.avisoRascunho.set('Rascunho salvo. Você pode enviar quando quiser.');
          } else {
            this.enviado.set({ ...res.data, titulo: this.titulo.trim() });
            this.contexto.recarregarVisao();
          }
        },
        error: (err: HttpErrorResponse) => {
          this.salvando.set(false);
          this.erro.set(
            [err.error?.message].flat().join(' ') || 'Não foi possível salvar o comunicado.',
          );
        },
      });
  }

  novo(): void {
    this.rascunhoId = null;
    this.titulo = '';
    this.mensagem = '';
    this.tipo = 'atividade';
    this.enviado.set(null);
    this.avisoRascunho.set('');
  }

  textoEnviado(e: ComunicadoSalvo & { titulo: string }): string {
    const familias = e.familias === 1 ? '1 família' : `${e.familias} famílias`;
    const nee =
      e.versaoSimplificada && e.alunosNee
        ? ` ${e.alunosNee === 1 ? 'O aluno NEE recebe' : 'Os ' + e.alunosNee + ' alunos NEE recebem'} a versão simplificada, que pode ser ouvida em voz alta.`
        : '';
    return `"${e.titulo}" foi enviado para ${familias} do ${e.turma}.${nee}`;
  }
}

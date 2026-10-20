import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SenhaProvisoria } from '../../../shared/senha/senha-provisoria';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { AlunoDetalhe, FamiliaCriada } from '../../../core/model/painel-escola.model';
import { VincularFamilia } from './vincular-familia';
import { PrivacidadeAluno } from './privacidade-aluno';
import { EscolaContexto } from '../escola-contexto';
import { dataBr } from '../../adm/escola-ui';
import {
  ROTULO_SITUACAO,
  corDaSituacao,
  corDoIndice,
  iniciaisPessoa,
  juntar,
  percentual,
} from '../escola-ui';

/** "Escola - Perfil do aluno" do Figma. */
@Component({
  selector: 'app-escola-aluno-perfil',
  imports: [RouterLink, SenhaProvisoria, VincularFamilia, PrivacidadeAluno],
  templateUrl: './aluno-perfil.html',
  styleUrl: './aluno-perfil.css',
})
export class EscolaAlunoPerfil {
  private service = inject(PainelEscolaService);
  private router = inject(Router);
  private contexto = inject(EscolaContexto);

  readonly pct = percentual;
  readonly iniciais = iniciaisPessoa;
  readonly cor = corDoIndice;
  readonly corSituacao = corDaSituacao;
  readonly rotuloSituacao = ROTULO_SITUACAO;
  readonly juntar = juntar;
  readonly dataBr = dataBr;

  readonly aluno = signal<AlunoDetalhe | null>(null);
  readonly erro = signal('');
  readonly baixando = signal(false);
  readonly salvo = signal<string | null>(null);
  readonly senha = signal<{ nome: string; email: string; senha: string } | null>(null);
  readonly gerando = signal<string | null>(null);
  readonly vinculando = signal(false);
  readonly avisoFamilia = signal('');

  constructor() {
    const rota = inject(ActivatedRoute);
    this.salvo.set(rota.snapshot.queryParamMap.get('salvo'));
    rota.paramMap
      .pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((p) => this.carregar(Number(p.get('id'))));
  }

  /** Dados apagados (LGPD): o aluno some da lista; volta para Alunos. */
  dadosApagados(): void {
    this.contexto.recarregar();
    void this.router.navigate(['/escola/alunos'], { queryParams: { apagado: 1 } });
  }

  private carregar(id: number): void {
    this.service.aluno(id).subscribe({
      next: (res) => this.aluno.set(res.data),
      error: (e: HttpErrorResponse) =>
        this.erro.set(
          e.status === 404 ? 'Aluno não encontrado.' : 'Não foi possível carregar o aluno.',
        ),
    });
  }

  fecharVinculo(a: AlunoDetalhe, resultado: FamiliaCriada | null): void {
    this.vinculando.set(false);
    if (!resultado) return;
    this.avisoFamilia.set(`${resultado.nome} agora acompanha ${a.nome.split(' ')[0]}.`);
    if (resultado.senhaProvisoria && resultado.email)
      this.senha.set({
        nome: resultado.nome,
        email: resultado.email,
        senha: resultado.senhaProvisoria,
      });
    this.carregar(a.id);
  }

  desvincular(a: AlunoDetalhe, responsavelId: number, nome: string): void {
    if (!confirm(`Desvincular ${nome} de ${a.nome}? A família continua cadastrada na escola.`))
      return;
    this.service.desvincularFamilia(a.id, responsavelId).subscribe({
      next: () => {
        this.avisoFamilia.set(`${nome} não acompanha mais ${a.nome.split(' ')[0]}.`);
        this.carregar(a.id);
      },
      error: () => this.erro.set('Não foi possível desvincular a família.'),
    });
  }

  subtitulo(a: AlunoDetalhe): string {
    return [
      a.turma?.nome,
      !a.neurodivergente
        ? 'Sem NEE'
        : a.diagnosticos.length
          ? a.diagnosticos.join(', ')
          : 'NEE - diagnóstico não informado',
      a.idade !== null ? `${a.idade} anos` : null,
      a.cgm ? `CGM ${a.cgm}` : null,
    ]
      .filter(Boolean)
      .join(' - ');
  }

  /** Gera senha provisoria do aluno ou de um responsavel e mostra uma vez. */
  redefinirSenha(tipo: 'alunos' | 'responsaveis', id: number, nome: string): void {
    if (!confirm(`Gerar uma nova senha para ${nome}? A senha atual deixa de funcionar.`)) return;
    const chave = `${tipo}-${id}`;
    this.gerando.set(chave);
    this.service.redefinirSenha(tipo, id).subscribe({
      next: (res) => {
        this.gerando.set(null);
        this.senha.set({ nome, email: res.data.email, senha: res.data.senhaProvisoria });
      },
      error: () => {
        this.gerando.set(null);
        this.erro.set(`Não foi possível gerar a senha de ${nome}.`);
      },
    });
  }

  /** O laudo exige o token: baixa como blob e abre o download pelo navegador. */
  baixarLaudo(a: AlunoDetalhe): void {
    this.baixando.set(true);
    this.service.baixarLaudo(a.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `laudo-${a.nome.toLowerCase().replace(/\s+/g, '-')}`;
        link.click();
        URL.revokeObjectURL(url);
        this.baixando.set(false);
      },
      error: () => {
        this.baixando.set(false);
        this.erro.set('Não foi possível baixar o laudo.');
      },
    });
  }
}

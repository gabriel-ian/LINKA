import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TarefaAluno } from '../../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { ConexaoService } from '../../../core/services/conexao.service';
import { VozService } from '../../../core/services/voz.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { NavegacaoService } from '../../../core/services/navegacao.service';
import { EditorTexto, temTexto } from '../../../shared/editor-texto/editor-texto';
import { AlunoContexto } from '../aluno-contexto';
import { ELOGIOS, hojeIso, horaCurta, iconePasso, plural, tituloCompleto } from '../aluno-ui';

/** Icone do Figma para cada material, pelo nome que a IA escreveu. */
const ICONES_MATERIAL: [RegExp, string][] = [
  [/calculadora/i, 'mat-calculadora'],
  [/r[eé]gua|esquadro|transferidor/i, 'mat-regua'],
  [/caneta|l[aá]pis|borracha|marca/i, 'mat-caneta'],
];

/**
 * "Aluno - Tarefa passo N" do Figma e a versao "modo calmo" (um passo por
 * vez, menos cores). Os passos sao concluidos em ordem.
 */
@Component({
  selector: 'app-aluno-tarefa',
  imports: [RouterLink, EditorTexto, DatePipe],
  templateUrl: './tarefa.html',
  styleUrl: './tarefa.css',
})
export class AlunoTarefa {
  private service = inject(PainelAlunoService);
  private router = inject(Router);
  readonly contexto = inject(AlunoContexto);
  readonly voz = inject(VozService);
  private conexao = inject(ConexaoService);
  private navegacao = inject(NavegacaoService);

  readonly tarefa = signal<TarefaAluno | null>(null);
  readonly erro = signal('');
  readonly salvando = signal(false);

  readonly icone = iconePasso;
  /** Comemoracao rapida depois de cada passo (some sozinha). */
  readonly comemoracao = signal<{ texto: string; falta: string } | null>(null);
  private timerComemoracao?: ReturnType<typeof setTimeout>;

  /** Resposta escrita (editor). */
  resposta = '';
  readonly escrevendo = signal(false);
  readonly enviandoResposta = signal(false);
  readonly erroResposta = signal('');
  readonly respostaEnviada = signal(false);

  readonly titulo = computed(() => {
    const t = this.tarefa();
    return t ? tituloCompleto(t) : '';
  });

  readonly calmo = computed(() => !!this.contexto.resumo()?.preferencias.modoCalmo);
  readonly feitos = computed(() => this.tarefa()?.passosFeitos ?? 0);
  readonly total = computed(() => this.tarefa()?.totalPassos ?? 0);
  readonly pct = computed(() =>
    this.total() ? Math.round((this.feitos() / this.total()) * 100) : 0,
  );
  /** Indice (0..) do passo atual; igual ao total quando tudo foi feito. */
  readonly atual = computed(() => this.feitos());

  readonly prazo = computed(() => {
    const t = this.tarefa();
    if (!t?.dataEntrega) return 'Sem prazo';
    const hora = t.horaLimite ? ` às ${horaCurta(t.horaLimite)}` : '';
    if (t.dataEntrega === hojeIso()) return `Vence hoje${hora}`;
    if (t.dataEntrega < hojeIso()) return 'Atrasada';
    const [, m, d] = t.dataEntrega.split('-');
    return `Entrega em ${d}/${m}${hora}`;
  });

  /** Concluida sem internet: falta enviar para a professora. */
  readonly aguardandoEnvio = computed(() => {
    const t = this.tarefa();
    return !!t && this.contexto.offline.aguardandoEnvio(t);
  });

  readonly situacao = computed(() => {
    const t = this.tarefa();
    if (!t) return { texto: '', cor: '' };
    if (this.aguardandoEnvio()) return { texto: 'Concluída - aguardando envio', cor: 'laranja' };
    if (t.situacao === 'concluida') return { texto: 'Concluída', cor: 'verde' };
    return this.feitos() > 0
      ? { texto: 'Em andamento', cor: 'laranja' }
      : { texto: 'Não iniciada', cor: 'cinza' };
  });

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((p) => this.carregar(Number(p.get('id'))));

    effect(() => {
      this.contexto.fala.set(
        this.calmo()
          ? 'Modo calmo ligado. Um passo de cada vez.'
          : 'Vamos com calma! Leia um passo de cada vez. Sem pressa - você consegue!',
      );
    });
  }

  private carregar(id: number): void {
    this.tarefa.set(null);
    const offline = this.contexto.offline;
    this.service.tarefa(id).subscribe({
      next: (res) => {
        offline.guardarTarefa(res.data);
        this.tarefa.set(offline.aplicar(res.data));
        this.resposta = res.data.resposta ?? '';
      },
      error: (e: HttpErrorResponse) => {
        // Sem internet: abre a copia guardada, com os passos feitos offline.
        const copia = ConexaoService.semRede(e) ? offline.lerTarefa(id) : null;
        if (ConexaoService.semRede(e)) this.conexao.online.set(false);
        if (copia) {
          this.tarefa.set(offline.aplicar(copia));
          return;
        }
        this.erro.set(
          e.status === 404
            ? 'Tarefa não encontrada.'
            : ConexaoService.semRede(e)
              ? 'Esta missão ainda não foi salva para usar sem internet. Abra de novo quando a conexão voltar.'
              : 'Não foi possível abrir a tarefa agora. Tente de novo.',
        );
      },
    });
  }

  private comemorar(feitos: number): void {
    const faltam = this.total() - feitos;
    const texto = this.calmo() ? 'Passo feito.' : ELOGIOS[feitos % ELOGIOS.length];
    const falta = faltam === 1 ? 'Falta só 1 passo!' : `Faltam ${faltam} passos.`;
    this.comemoracao.set({ texto, falta });
    this.contexto.fala.set(`${texto} ${falta}`);
    clearTimeout(this.timerComemoracao);
    this.timerComemoracao = setTimeout(() => this.comemoracao.set(null), 2200);
  }

  /** Volta para onde o aluno estava (Agenda, Inicio ou Tarefas). */
  voltar(): void {
    this.navegacao.voltar('/aluno/tarefas');
  }

  enviarResposta(): void {
    const t = this.tarefa();
    if (!t) return;
    if (!temTexto(this.resposta)) {
      this.erroResposta.set('Escreva a sua resposta antes de enviar.');
      return;
    }
    this.enviandoResposta.set(true);
    this.erroResposta.set('');
    this.service.entregarResposta(t.id, this.resposta).subscribe({
      next: () => {
        this.enviandoResposta.set(false);
        this.escrevendo.set(false);
        this.respostaEnviada.set(true);
        this.tarefa.set({
          ...t,
          resposta: this.resposta,
          respostaEm: new Date().toISOString(),
          entregue: true,
        });
        this.contexto.fala.set('Resposta enviada para a professora. Muito bem!');
      },
      error: (e: HttpErrorResponse) => {
        this.enviandoResposta.set(false);
        this.erroResposta.set(
          ConexaoService.semRede(e)
            ? 'Sem internet agora. Sua resposta continua aqui; envie quando a conexão voltar.'
            : mensagemDeErro(e, 'Não foi possível enviar a resposta. Tente de novo.'),
        );
      },
    });
  }

  iconeMaterial(nome: string): string {
    const achado = ICONES_MATERIAL.find(([re]) => re.test(nome));
    return `assets/aluno/${achado?.[1] ?? 'mat-caderno'}.svg`;
  }

  textoPassos(n: number): string {
    return plural(n, 'passo', 'passos');
  }

  ouvirObjetivo(): void {
    const t = this.tarefa();
    if (t) this.voz.falar(`Objetivo da tarefa: ${t.objetivo}`);
  }

  ouvirMateriais(): void {
    const t = this.tarefa();
    if (t?.materiais.length) this.voz.falar(`Você vai precisar de: ${t.materiais.join(', ')}.`);
  }

  ouvirPasso(i: number): void {
    const t = this.tarefa();
    if (t) this.voz.falar(`Passo ${i + 1}. ${t.passos[i]}`);
  }

  concluirPasso(): void {
    const t = this.tarefa();
    if (!t || this.salvando()) return;
    const passo = this.feitos() + 1;
    this.erro.set('');
    // Com passos ja na fila, este tambem vai para a fila (a ordem importa).
    const naFila = this.contexto.offline.fila().some((p) => p.tarefaId === t.id);
    if (this.contexto.semConexao() || naFila) {
      this.guardarOffline(t, passo);
      return;
    }

    this.salvando.set(true);
    this.service.concluirPasso(t.id, passo).subscribe({
      next: (res) => {
        this.salvando.set(false);
        this.contexto.recarregar();
        if (res.data.concluida) {
          this.voz.parar();
          this.router.navigate(['/aluno/tarefas', t.id, 'concluida'], {
            state: { resultado: res.data, titulo: this.titulo() },
          });
          return;
        }
        this.tarefa.set({ ...t, passosFeitos: res.data.passosFeitos, situacao: 'em-andamento' });
        this.comemorar(res.data.passosFeitos);
        if (this.contexto.resumo()?.preferencias.ouvirVoz) this.ouvirPasso(res.data.passosFeitos);
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        if (ConexaoService.semRede(e)) {
          this.conexao.online.set(false);
          this.guardarOffline(t, passo);
          return;
        }
        this.erro.set(mensagemDeErro(e, 'Não foi possível salvar o passo. Tente de novo.'));
        if (e.status === 400) this.carregar(t.id);
      },
    });
  }

  /** Sem internet: o passo fica guardado e vai para o servidor depois. */
  private guardarOffline(t: TarefaAluno, passo: number): void {
    this.contexto.offline.adicionar({
      tarefaId: t.id,
      passo,
      feitoEm: new Date().toISOString(),
    });
    this.contexto.aplicarPendentes();
    this.tarefa.set(this.contexto.offline.aplicar(t));
    if (passo < t.totalPassos && this.contexto.resumo()?.preferencias.ouvirVoz) {
      this.ouvirPasso(passo);
    }
  }

  voltarAoNormal(): void {
    this.service.salvarPreferencias({ modoCalmo: false }).subscribe({
      next: (res) => this.contexto.resumo.set(res.data),
    });
  }
}

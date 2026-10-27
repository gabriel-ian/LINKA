import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
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
import { DialogoService } from '../../../core/services/dialogo.service';
import { EditorTexto, temTexto } from '../../../shared/editor-texto/editor-texto';
import { AnexosLista } from '../../../shared/anexos/anexos-lista';
import { EntregaArquivos } from '../entrega-arquivos';
import { MascoteDesenho } from '../../../shared/mascote/mascote';
import { Anexo } from '../../../core/model/anexo.model';
import { AlunoContexto } from '../aluno-contexto';
import { ELOGIOS, hojeIso, horaCurta, iconePasso, plural, tituloCompleto } from '../aluno-ui';

/** Depois deste tempo no mesmo passo, o mascote sugere uma pausa. */
const PAUSA_SEGUNDOS = 10 * 60;

/**
 * Icone de cada material, pelo nome que a IA escreveu: o desenho do Figma
 * quando existe, senao um emoji. A ordem importa ("lapis de cor" antes de "lapis").
 */
const ICONES_MATERIAL: [RegExp, { svg?: string; emoji?: string }][] = [
  [/calculadora/i, { svg: 'mat-calculadora' }],
  [/r[eé]gua|esquadro|transferidor/i, { svg: 'mat-regua' }],
  [/celular|telefone|smartphone|tablet/i, { svg: 'mat-celular' }],
  [/computador|notebook|chromebook|laptop/i, { emoji: '💻' }],
  [/fone|headphone/i, { emoji: '🎧' }],
  [/l[aá]pis de cor|giz|canetinha|hidrocor/i, { emoji: '🖍️' }],
  [/caneta|l[aá]pis|borracha|marca/i, { svg: 'mat-caneta' }],
  [/tesoura/i, { emoji: '✂️' }],
  [/cola\b/i, { emoji: '🧴' }],
  [/tinta|pincel|aquarela/i, { emoji: '🎨' }],
  [/dicion[aá]rio/i, { emoji: '📕' }],
  [/apostila|livro/i, { emoji: '📖' }],
  [/caderno/i, { svg: 'mat-caderno' }],
  [/folha|papel|cartolina|sulfite/i, { emoji: '📄' }],
  [/mapa|atlas|globo/i, { emoji: '🗺️' }],
  [/internet|site|pesquisa/i, { emoji: '🌐' }],
  [/[aá]gua|garrafa/i, { emoji: '💧' }],
];

/**
 * "Aluno - Tarefa passo N" do Figma e a versao "modo calmo" (um passo por
 * vez, menos cores). Os passos sao concluidos em ordem.
 */
@Component({
  selector: 'app-aluno-tarefa',
  imports: [RouterLink, EditorTexto, DatePipe, AnexosLista, EntregaArquivos, MascoteDesenho],
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
  private dialogo = inject(DialogoService);

  readonly tarefa = signal<TarefaAluno | null>(null);
  readonly erro = signal('');
  readonly salvando = signal(false);

  readonly icone = iconePasso;
  readonly baixarAnexo = (a: Anexo) => this.service.baixarAnexo(this.tarefa()!.id, a.id);
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

  /**
   * A professora editou a tarefa depois que o aluno comecou (ou nos ultimos
   * 3 dias, se ele ainda nao comecou).
   */
  readonly atualizada = computed(() => {
    const t = this.tarefa();
    if (!t?.atualizadaEm) return false;
    const quando = new Date(t.atualizadaEm).getTime();
    return quando > Date.now() - 3 * 86_400_000;
  });

  /** "Relogio nos passos": tempo no passo atual e pausa sugerida. */
  readonly comRelogio = computed(() => !!this.contexto.resumo()?.preferencias.tempoPasso);
  readonly segundos = signal(0);
  readonly relogio = computed(() => {
    const s = this.segundos();
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  });
  readonly pausaSugerida = computed(() => this.segundos() >= PAUSA_SEGUNDOS);

  /** Entregue: foto e resposta ficam so para ver. */
  readonly entregue = computed(() => this.tarefa()?.situacao === 'concluida');
  /** Todos os passos feitos e ainda nao entregue: aparece "Entregar a tarefa". */
  readonly podeEntregar = computed(
    () => !!this.tarefa() && !this.entregue() && this.total() > 0 && this.feitos() >= this.total(),
  );
  readonly entregando = signal(false);
  readonly erroEntrega = signal('');

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

    // Relogio: zera a cada passo novo e conta so com a opcao ligada.
    effect(() => {
      this.atual();
      this.tarefa()?.id;
      untracked(() => this.segundos.set(0));
    });
    const tique = setInterval(() => {
      if (!this.comRelogio() || document.hidden || this.atual() >= this.total()) return;
      this.segundos.update((s) => s + 1);
      if (this.segundos() === PAUSA_SEGUNDOS)
        this.contexto.fala.set(
          'Você está há 10 minutos neste passo. Que tal uma pausa de 1 minuto? Respire e estique os braços.',
        );
    }, 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(tique));

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
    this.lerSeparados(id);
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
    const falta =
      faltam <= 0
        ? 'Agora é só entregar a tarefa!'
        : faltam === 1
          ? 'Falta só 1 passo!'
          : `Faltam ${faltam} passos.`;
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

  async entregar(): Promise<void> {
    const t = this.tarefa();
    if (!t || this.entregando()) return;
    if (this.contexto.semConexao()) {
      this.erroEntrega.set('Sem internet agora. Entregue quando a conexão voltar.');
      return;
    }
    const sim = await this.dialogo.confirmar({
      titulo: 'Entregar a tarefa?',
      mensagem: t.arquivosEnviados?.length || t.resposta
        ? 'Depois de entregar, não dá para mudar a foto nem a resposta.'
        : 'Você não mandou foto nem resposta escrita. Depois de entregar, não dá para mandar mais.',
      confirmar: 'Sim, entregar',
      cancelar: 'Ainda não',
    });
    if (!sim) return;
    this.entregando.set(true);
    this.erroEntrega.set('');
    this.service.finalizar(t.id).subscribe({
      next: (res) => {
        this.entregando.set(false);
        this.contexto.recarregar();
        this.voz.parar();
        this.router.navigate(['/aluno/tarefas', t.id, 'concluida'], {
          state: { resultado: res.data, titulo: this.titulo() },
        });
      },
      error: (e: HttpErrorResponse) => {
        this.entregando.set(false);
        this.erroEntrega.set(
          ConexaoService.semRede(e)
            ? 'Sem internet agora. Entregue quando a conexão voltar.'
            : mensagemDeErro(e, 'Não foi possível entregar agora. Tente de novo.'),
        );
      },
    });
  }

  arquivosMudaram(lista: Anexo[]): void {
    const t = this.tarefa();
    if (!t) return;
    this.tarefa.set({
      ...t,
      arquivosEnviados: lista,
      entregue: !!t.respostaEm || lista.length > 0,
    });
    if (lista.length) this.contexto.fala.set('Enviado para a professora. Muito bem!');
  }

  ouvirComentario(): void {
    const t = this.tarefa();
    if (t?.comentario) this.voz.falar(`Recado da professora: ${t.comentario}`);
  }

  iconeMaterial(nome: string): { svg?: string; emoji?: string } {
    const achado = ICONES_MATERIAL.find(([re]) => re.test(nome))?.[1];
    if (achado?.svg) return { svg: `assets/aluno/${achado.svg}.svg` };
    return { emoji: achado?.emoji ?? '🎒' };
  }

  /** Materiais que o aluno ja separou (marcados so neste aparelho). */
  readonly separados = signal<string[]>([]);

  private chaveSeparados(id: number): string {
    return `linka-materiais:${id}`;
  }

  private lerSeparados(id: number): void {
    try {
      this.separados.set(JSON.parse(localStorage.getItem(this.chaveSeparados(id)) ?? '[]'));
    } catch {
      this.separados.set([]);
    }
  }

  separar(m: string): void {
    const t = this.tarefa();
    if (!t) return;
    const lista = this.separados().includes(m)
      ? this.separados().filter((x) => x !== m)
      : [...this.separados(), m];
    this.separados.set(lista);
    try {
      localStorage.setItem(this.chaveSeparados(t.id), JSON.stringify(lista));
    } catch {
      // Sem armazenamento: a marcacao vale so enquanto a tela esta aberta.
    }
    if (lista.includes(m) && lista.length === t.materiais.length)
      this.contexto.fala.set('Tudo separado! Agora é só começar.');
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
        this.tarefa.set({ ...t, passosFeitos: res.data.passosFeitos, situacao: 'em-andamento' });
        this.comemorar(res.data.passosFeitos);
        if (res.data.passosFeitos >= t.totalPassos) {
          // Ultimo passo: leva ate "Entregar a tarefa" (antes, pode mandar foto).
          setTimeout(() =>
            document.getElementById('entregar')?.scrollIntoView({ behavior: 'smooth' }),
          );
          return;
        }
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

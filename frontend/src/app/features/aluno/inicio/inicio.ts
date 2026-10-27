import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { DesenhoAluno } from '../desenho/desenho';
import { DialogoService } from '../../../core/services/dialogo.service';
import { IncentivoAluno, TarefaResumoAluno } from '../../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { VozService } from '../../../core/services/voz.service';
import { RouterLink } from '@angular/router';
import { AlunoContexto } from '../aluno-contexto';
import { ItemTarefa } from '../item-tarefa';
import { MascoteDesenho } from '../../../shared/mascote/mascote';
import { dataLonga, hojeIso, horaCurta, plural, tituloCompleto } from '../aluno-ui';

/** "Aluno - Início" do Figma, e a versão "Aluno - Sem conexão". */
@Component({
  selector: 'app-aluno-inicio',
  imports: [RouterLink, ItemTarefa, MascoteDesenho, DesenhoAluno],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class AlunoInicio {
  readonly contexto = inject(AlunoContexto);
  readonly voz = inject(VozService);
  private service = inject(PainelAlunoService);
  /** Incentivos que o Dino ja leu sozinho nesta visita. */
  private lidosEmVoz = new Set<number>();
  readonly hoje = dataLonga();

  /** Desenho do aluno no cartao do mascote (URL do blob). */
  readonly urlDesenho = signal<string | null>(null);
  readonly desenhando = signal(false);
  readonly salvandoDesenho = signal(false);
  private dialogo = inject(DialogoService);

  /** Enfeites da cena de cada mascote. */
  readonly enfeites = computed(
    () =>
      ({ dino: ['🌿', '☀️', '🦴'], coruja: ['🌙', '⭐', '📚'], robo: ['⚙️', '💡', '🔧'] })[
        this.contexto.mascote()
      ],
  );
  readonly titulo = tituloCompleto;

  /** Ate 3 tarefas: as de hoje primeiro, depois as proximas. */
  readonly lista = computed(() =>
    [...this.contexto.deHoje(), ...this.contexto.proximas()].slice(0, 3),
  );

  readonly abertasHoje = computed(() =>
    this.contexto.deHoje().filter((t) => t.situacao !== 'concluida'),
  );

  /** A missao mais urgente: atrasada ou de hoje, a de prazo mais cedo. */
  readonly urgente = computed(() => this.abertasHoje()[0] ?? null);

  readonly avisoUrgente = computed(() => {
    const t = this.urgente();
    if (!t) return '';
    const quando =
      t.dataEntrega && t.dataEntrega < hojeIso()
        ? ' está atrasada.'
        : ` vence hoje${t.horaLimite ? ' às ' + horaCurta(t.horaLimite) : ''}.`;
    const andamento =
      t.situacao === 'em-andamento'
        ? ` Você já fez ${t.passosFeitos} de ${t.totalPassos} passos.`
        : ' Ainda não começou.';
    return quando + andamento;
  });

  /**
   * Sem internet: o que ainda espera envio (mesmo atrasada, ela sai de "hoje"
   * ao ser concluida), depois as de hoje; sem nenhuma, as proximas.
   */
  readonly missoesOffline = computed(() => {
    const offline = this.contexto.offline;
    const enviando = (this.contexto.resumo()?.tarefas ?? []).filter((t) =>
      offline.aguardandoEnvio(t),
    );
    const hoje = this.contexto.deHoje().filter((t) => !offline.aguardandoEnvio(t));
    const lista = [...enviando, ...hoje];
    return lista.length ? lista : this.contexto.proximas().slice(0, 3);
  });

  /** Selo de cada missao no modo sem internet (Figma "Sem conexão"). */
  seloOffline(t: TarefaResumoAluno): { texto: string; cor: string } {
    const offline = this.contexto.offline;
    if (offline.aguardandoEnvio(t))
      return { texto: 'Concluída - aguardando envio', cor: 'laranja' };
    if (t.situacao === 'concluida') return { texto: 'Concluída', cor: 'cinza' };
    return offline.disponivel(t.id)
      ? { texto: 'Disponível offline', cor: 'verde' }
      : { texto: 'Precisa de internet', cor: 'cinza' };
  }

  /** Recado mais novo da familia (some quando o aluno agradece). */
  readonly incentivo = computed(() => this.contexto.resumo()?.incentivos[0] ?? null);

  recado(i: IncentivoAluno): string {
    return `${i.de} mandou um recado: ${i.mensagem}`;
  }

  /** "Obrigado!": marca como visto e tira da tela. */
  agradecer(i: IncentivoAluno): void {
    this.service.marcarIncentivoLido(i.id).subscribe();
    this.contexto.resumo.update((r) =>
      r ? { ...r, incentivos: r.incentivos.filter((x) => x.id !== i.id) } : r,
    );
  }

  constructor() {
    let desenhoCarregado: string | null | undefined;
    effect(() => {
      const quando = this.contexto.resumo()?.preferencias.desenhoEm ?? null;
      if (quando === desenhoCarregado) return;
      desenhoCarregado = quando;
      if (!quando) {
        this.trocarDesenho(null);
        return;
      }
      this.service.desenho().subscribe({
        next: (blob) => this.trocarDesenho(URL.createObjectURL(blob)),
        error: () => this.trocarDesenho(null),
      });
    });
    inject(DestroyRef).onDestroy(() => this.trocarDesenho(null));

    // Com "voz do mascote", ele le o recado assim que a tela abre.
    effect(() => {
      const i = this.incentivo();
      if (!i || !i.voz || this.lidosEmVoz.has(i.id)) return;
      this.lidosEmVoz.add(i.id);
      this.voz.falar(this.recado(i));
    });

    effect(() => {
      const r = this.contexto.resumo();
      if (!r) return;
      const i = this.incentivo();
      if (i) {
        this.contexto.fala.set(this.recado(i));
        return;
      }
      const n = this.abertasHoje().length;
      this.contexto.fala.set(
        n
          ? `Oi ${r.aluno.primeiroNome}! Você tem ${plural(n, 'missão', 'missões')} hoje. Quer começar pela mais fácil?`
          : `Oi ${r.aluno.primeiroNome}! Nenhuma missão para hoje. Que tal ver suas conquistas?`,
      );
    });
  }

  private trocarDesenho(url: string | null): void {
    const antiga = this.urlDesenho();
    if (antiga) URL.revokeObjectURL(antiga);
    this.urlDesenho.set(url);
  }

  salvarDesenho(png: Blob): void {
    this.salvandoDesenho.set(true);
    this.service.salvarDesenho(png).subscribe({
      next: (res) => {
        this.salvandoDesenho.set(false);
        this.desenhando.set(false);
        this.trocarDesenho(URL.createObjectURL(png));
        this.contexto.resumo.set(res.data);
        this.contexto.fala.set('Que desenho lindo!');
      },
      error: () => {
        this.salvandoDesenho.set(false);
        this.dialogo.avisar('Não foi possível salvar o desenho agora.', 'erro');
      },
    });
  }

  async voltarAoMascote(): Promise<void> {
    const sim = await this.dialogo.confirmar({
      titulo: 'Tirar o desenho?',
      mensagem: 'O cartão volta a mostrar o seu mascote.',
      confirmar: 'Sim, tirar',
      cancelar: 'Manter o desenho',
    });
    if (!sim) return;
    this.service.apagarDesenho().subscribe({
      next: (res) => this.contexto.resumo.set(res.data),
      error: () => this.dialogo.avisar('Não foi possível tirar o desenho agora.', 'erro'),
    });
  }
}

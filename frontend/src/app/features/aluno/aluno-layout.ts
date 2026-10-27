import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { VozService } from '../../core/services/voz.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ConfigPainel, Notificacao, PainelLayout } from '../../shared/painel-layout/painel-layout';
import { AlunoContexto } from './aluno-contexto';
import { horaCurta, tituloCompleto } from './aluno-ui';

const ALUNO = 'assets/aluno/menu-';
const ESCOLA = 'assets/escola/menu-';
const PROF = 'assets/professor/menu-';

/** Moldura das telas "Aluno - ..." do Figma: o mascote fala na barra. */
@Component({
  selector: 'app-aluno-layout',
  host: {
    '(document:pointermove)': 'moverRegua($event)',
    '[style.--cor-mascote]': 'contexto.infoMascote().cor',
    '[style.--cor-mascote-clara]': 'contexto.infoMascote().corClara',
    '[style.--cor-mascote-fundo]': 'contexto.infoMascote().corFundo',
  },
  imports: [RouterOutlet, PainelLayout],
  template: `
    <app-painel-layout [config]="config()" [notificacoes]="notificacoes()">
      @if (contexto.erro()) {
        <p class="alerta-erro" role="alert">{{ contexto.erro() }}</p>
      }
      <router-outlet />
    </app-painel-layout>
    @if (regua()) {
      <div class="regua" aria-hidden="true" [style.top.px]="reguaY()"></div>
    }
  `,
  styles: `
    /* Regua de leitura: faixa que segue o mouse ou o dedo e destaca a linha. */
    .regua {
      position: fixed;
      left: 0;
      right: 0;
      z-index: 50;
      height: 2.6em;
      translate: 0 -50%;
      border-block: 2px solid color-mix(in srgb, var(--cor-mascote) 60%, transparent);
      background: color-mix(in srgb, #fde68a 35%, transparent);
      box-shadow: 0 0 0 100vmax rgba(15, 23, 42, 0.12);
      pointer-events: none;
    }
  `,
  providers: [AlunoContexto],
})
export class AlunoLayout {
  readonly contexto = inject(AlunoContexto);
  private router = inject(Router);

  readonly regua = computed(() => !!this.contexto.resumo()?.preferencias.reguaLeitura);
  readonly reguaY = signal(240);

  moverRegua(e: PointerEvent): void {
    if (this.regua()) this.reguaY.set(e.clientY);
  }

  constructor() {
    // Voz e velocidade escolhidas pelo aluno; o tom e o do mascote.
    const voz = inject(VozService);
    effect(() => {
      const p = this.contexto.resumo()?.preferencias;
      voz.configurar({
        voz: p?.voz ?? null,
        velocidade: p?.velocidadeVoz ?? 'normal',
        tom: this.contexto.infoMascote().tom,
      });
    });
    inject(DestroyRef).onDestroy(() => voz.configurar(null));
  }

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly config = computed<ConfigPainel>(() => {
    const r = this.contexto.resumo();
    const naTarefa = /^\/aluno\/tarefas\/\d+/.test(this.url());

    return {
      titulo: r?.aluno.nome ?? 'Aluno',
      perfil: 'Aluno(a)',
      perfilRota: '/aluno/perfil',
      infos: r?.aluno.turma ? [{ icone: 'turma', texto: r.aluno.turma }] : [],
      fala: this.contexto.semConexao()
        ? 'Sem internet agora - mas suas missões estão salvas.'
        : this.contexto.fala() || (r ? `Oi ${r.aluno.primeiroNome}! Bora conquistar o dia?` : ''),
      mascote: this.contexto.mascote(),
      modoCalmo: r?.preferencias.modoCalmo,
      letrasMaiores: r?.preferencias.letrasMaiores,
      fonteDislexia: r?.preferencias.fonteDislexia,
      altoContraste: r?.preferencias.altoContraste,
      medidas: { rotuloX: 41, visaoX: 12, secaoTam: 32, gapItens: 15 },
      abas: [
        { rota: '/aluno', rotulo: 'Início', icone: 'inicio' },
        { rota: '/aluno/tarefas', rotulo: 'Tarefas', icone: 'tarefas', exato: false },
        { rota: '/aluno/avisos', rotulo: 'Avisos', icone: 'avisos' },
        { rota: '/aluno/progresso', rotulo: 'Progresso', icone: 'progresso' },
        { rota: '/aluno/perfil', rotulo: 'Perfil', icone: 'perfil' },
      ],
      secoes: [
        {
          titulo: 'MENU',
          itens: [
            { rota: '/aluno', rotulo: 'Início', icone: 'visao' },
            {
              rota: '/aluno/tarefas',
              rotulo: 'Tarefas',
              selecionado: naTarefa,
              contador: this.contexto.deHoje().filter((t) => t.situacao !== 'concluida').length,
              icone: [{ src: ALUNO + 'tarefas', left: 12, top: 13.5 }],
            },
            {
              rota: '/aluno/avisos',
              rotulo: 'Avisos',
              contador: r?.avisosNaoLidos ?? 0,
              icone: [{ src: PROF + 'comunicados', left: 14.2, top: 13.2 }],
            },
            {
              rota: '/aluno/progresso',
              rotulo: 'Progresso',
              icone: [{ src: ESCOLA + 'relatorios', left: 10.9, top: 14, espelhar: true }],
            },
            {
              rota: '/aluno/conquistas',
              rotulo: 'Conquistas',
              icone: [{ src: ALUNO + 'conquistas', left: 11.9, top: 15 }],
            },
          ],
        },
        {
          titulo: 'MAIS',
          itens: [
            {
              rota: '/aluno/agenda',
              rotulo: 'Agenda',
              icone: [{ src: ALUNO + 'agenda', left: 12.9, top: 14 }],
            },
            {
              rota: '/aluno/perfil',
              rotulo: 'Meu perfil',
              icone: [{ src: ALUNO + 'perfil', left: 12.9, top: 14 }],
            },
          ],
        },
      ],
      conta: {
        iniciais: r?.aluno.iniciais ?? 'AL',
        nome: r?.aluno.nome ?? 'Aluno',
        detalhe: r?.aluno.turma ?? '',
        links: [
          { rota: '/aluno/perfil', rotulo: 'Meu perfil' },
          { rota: '/aluno/conquistas', rotulo: 'Minhas conquistas' },
        ],
      },
    };
  });

  /** Missoes de hoje ainda abertas. */
  readonly notificacoes = computed<Notificacao[]>(() =>
    this.contexto
      .deHoje()
      .filter((t) => t.situacao !== 'concluida')
      .map((t) => ({
        chave: `tarefa-${t.id}-${t.situacao}`,
        cor: t.situacao === 'em-andamento' ? 'verde' : 'laranja',
        titulo: tituloCompleto(t),
        texto:
          t.situacao === 'em-andamento'
            ? `Você já fez ${t.passosFeitos} de ${t.totalPassos} passos.`
            : 'Ainda não começou.',
        quando: t.horaLimite ? `Vence hoje às ${horaCurta(t.horaLimite)}` : 'Para hoje',
      })),
  );
}

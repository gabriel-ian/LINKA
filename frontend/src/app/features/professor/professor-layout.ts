import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ConfigPainel, Notificacao, PainelLayout } from '../../shared/painel-layout/painel-layout';
import { ProfessorContexto } from './professor-contexto';
import { iniciaisPessoa, juntar } from '../escola/escola-ui';

const ESCOLA = 'assets/escola/menu-';
const PROF = 'assets/professor/menu-';

/** Moldura das telas "Professor - ..." do Figma. */
@Component({
  selector: 'app-professor-layout',
  imports: [RouterOutlet, PainelLayout],
  template: `
    <app-painel-layout [config]="config()" [notificacoes]="notificacoes()">
      @if (contexto.erro()) {
        <p class="alerta-erro" role="alert">{{ contexto.erro() }}</p>
      }
      <router-outlet />
    </app-painel-layout>
  `,
  providers: [ProfessorContexto],
})
export class ProfessorLayout {
  readonly contexto = inject(ProfessorContexto);
  private router = inject(Router);

  /** URL atual, para destacar "Tarefas" tambem no detalhe de uma tarefa. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly config = computed<ConfigPainel>(() => {
    const dados = this.contexto.dados();
    const turmaAtual = this.contexto.turmaId();
    const naTarefa = /^\/professor\/tarefas\/\d+/.test(this.url());
    const disciplinas = juntar(dados?.disciplinas.map((d) => d.nome) ?? []);

    return {
      titulo: dados?.nome ?? 'Professor',
      detalhe: dados ? [dados.escola, disciplinas].filter(Boolean).join(' - ') : '',
      tituloPequeno: true,
      medidas: { rotuloX: 41, visaoX: 12, secaoTam: 32, gapItens: 15 },
      secoes: [
        {
          titulo: 'MENU',
          itens: [
            { rota: '/professor', rotulo: 'Visão geral', icone: 'visao' },
            {
              rota: '/professor/tarefas/nova',
              rotulo: 'Nova tarefa',
              icone: [{ src: PROF + 'nova-tarefa', left: 12, top: 12 }],
            },
            {
              rota: '/professor/tarefas',
              rotulo: 'Tarefas',
              selecionado: naTarefa,
              icone: [{ src: PROF + 'tarefas', left: 12.7, top: 13.2 }],
            },
            {
              rota: turmaAtual ? `/professor/turmas/${turmaAtual}` : '/professor',
              rotulo: 'Turma',
              exato: false,
              icone: [{ src: ESCOLA + 'professores', left: 11.9, top: 16 }],
            },
            {
              rota: '/professor/comunicados',
              rotulo: 'Comunicados',
              icone: [{ src: PROF + 'comunicados', left: 14.2, top: 13.2 }],
            },
            {
              rota: '/professor/relatorios',
              rotulo: 'Relatórios',
              icone: [{ src: ESCOLA + 'relatorios', left: 10.9, top: 14, espelhar: true }],
            },
          ],
        },
        {
          titulo: 'TURMAS',
          itens: (dados?.turmas ?? []).map((t) => ({
            rota: `/professor/turmas/${t.id}`,
            rotulo: t.nome,
            exato: false,
            selecionado: t.id === turmaAtual,
            icone: [{ src: ESCOLA + 'turmas', left: 11.15, top: 16.2 }],
          })),
        },
      ],
      conta: {
        iniciais: dados ? iniciaisPessoa(dados.nome) : 'PR',
        nome: dados?.nome ?? 'Professor',
        detalhe: disciplinas,
        links: [
          {
            rota: turmaAtual ? `/professor/turmas/${turmaAtual}` : '/professor',
            rotulo: 'Minha turma',
          },
          { rota: '/professor/relatorios', rotulo: 'Relatórios' },
        ],
      },
    };
  });

  /** Calculadas da turma selecionada: alunos com atraso e tarefas do dia. */
  readonly notificacoes = computed<Notificacao[]>(() => {
    const visao = this.contexto.visao();
    if (!visao) return [];

    const lista: Notificacao[] = visao.alunosNee
      .filter((a) => a.situacao === 'atencao' && a.resumo.includes('atrasad'))
      .map((a) => ({
        chave: `atraso-${a.id}-${a.resumo}`,
        cor: 'vermelho',
        titulo: `${a.nome} precisa de atenção`,
        texto: `${a.resumo[0].toUpperCase()}${a.resumo.slice(1)} em ${visao.turma.nome}.`,
        quando: 'Agora',
      }));

    for (const t of visao.tarefasRecentes.filter(
      (x) => x.status === 'hoje' || x.status === 'concluida',
    )) {
      lista.push({
        chave: `entrega-${t.id}-${t.entregues}`,
        cor: t.status === 'concluida' ? 'verde' : 'laranja',
        titulo: `${t.entregues} de ${t.total} alunos entregaram`,
        texto: `${t.titulo}${t.disciplina ? ' - ' + t.disciplina : ''}.`,
        quando:
          t.status === 'hoje'
            ? `Vence hoje${t.horaLimite ? ' às ' + t.horaLimite : ''}`
            : 'Concluída',
      });
    }

    return lista;
  });
}

import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  ConfigPainel,
  ItemMenu,
  Notificacao,
  PainelLayout,
} from '../../shared/painel-layout/painel-layout';
import { hojeIso, horaCurta, tituloCompleto } from '../aluno/aluno-ui';
import { FamiliaContexto } from './familia-contexto';
import { TermoAceite } from './termo-aceite';

const ALUNO = 'assets/aluno/menu-';
const ESCOLA = 'assets/escola/menu-';

/** Moldura das telas "Familia - ..." do Figma: menu e a lista "FILHO (A)". */
@Component({
  selector: 'app-familia-layout',
  imports: [RouterOutlet, PainelLayout, TermoAceite],
  template: `
    <app-painel-layout [config]="config()" [notificacoes]="notificacoes()">
      @if (contexto.erro()) {
        <p class="alerta-erro" role="alert">{{ contexto.erro() }}</p>
      }
      @if (contexto.dados(); as d) {
        @if (d.termo.pendente) {
          <app-termo-aceite (aceito)="contexto.termoAceito()" />
        } @else if (d.filhos.length) {
          <router-outlet />
        } @else {
          <div class="cartao sem-filho">
            <h1 class="cartao-titulo">Nenhum filho vinculado ainda</h1>
            <p>
              Peça para a escola vincular seu filho(a) à sua conta. Assim que isso acontecer, as
              tarefas e os avisos aparecem aqui.
            </p>
          </div>
        }
      }
    </app-painel-layout>
  `,
  styles: `
    .sem-filho {
      max-width: 640px;
    }
    .sem-filho p {
      margin: 0;
      font-size: 16px;
      line-height: 22px;
    }
  `,
  providers: [FamiliaContexto],
})
export class FamiliaLayout {
  readonly contexto = inject(FamiliaContexto);

  readonly config = computed<ConfigPainel>(() => {
    const d = this.contexto.dados();
    const resp = d?.responsavel;
    const filhoId = this.contexto.filhoId();

    const filhos: ItemMenu[] = (d?.filhos ?? []).map((f) => ({
      rota: `filho:${f.id}`,
      rotulo: f.nome,
      tom: 'filho',
      selecionado: f.id === filhoId,
      aoClicar: () => this.contexto.selecionar(f.id),
      icone: [{ src: 'assets/familia/menu-filho', left: 13, top: 14 }],
    }));

    return {
      titulo: resp ? `FAMÍLIA ${resp.sobrenome.toUpperCase()}` : 'FAMÍLIA',
      detalhe: resp ? `Responsável: ${resp.nome}` : '',
      tituloPequeno: true,
      avatar: resp?.iniciais ?? '',
      medidas: { rotuloX: 41, visaoX: 12, secaoTam: 32, gapItens: 15 },
      abas: [
        { rota: '/familia', rotulo: 'Painel', icone: 'inicio' },
        { rota: '/familia/avisos', rotulo: 'Avisos', icone: 'avisos' },
        { rota: '/familia/relatorios', rotulo: 'Relatórios', icone: 'relatorios' },
        { rota: '/familia/configuracoes', rotulo: 'Ajustes', icone: 'ajustes' },
      ],
      secoes: [
        {
          titulo: 'MENU',
          itens: [
            { rota: '/familia', rotulo: 'Painel familiar', icone: 'visao' },
            {
              rota: '/familia/avisos',
              rotulo: 'Avisos da Escola',
              contador: this.contexto.painel()?.avisosNaoLidos ?? 0,
              contadorNoCanto: true,
              icone: [{ src: ALUNO + 'tarefas', left: 12, top: 13.5 }],
            },
            {
              rota: '/familia/relatorios',
              rotulo: 'Relatórios',
              icone: [{ src: ESCOLA + 'relatorios', left: 10.9, top: 14, espelhar: true }],
            },
            {
              rota: '/familia/configuracoes',
              rotulo: 'Configurações',
              icone: [{ src: ALUNO + 'conquistas', left: 11.9, top: 15 }],
            },
          ],
        },
        ...(filhos.length ? [{ titulo: 'FILHO (A)', itens: filhos }] : []),
      ],
      conta: {
        iniciais: resp?.iniciais ?? 'RS',
        nome: resp?.nome ?? 'Responsável',
        detalhe: resp?.parentesco ?? 'Responsável',
        links: [
          { rota: '/familia/configuracoes', rotulo: 'Configurações' },
          { rota: '/familia/relatorios', rotulo: 'Relatórios' },
        ],
      },
    };
  });

  /** Tarefa de hoje sem comecar, atrasadas e avisos novos do filho escolhido. */
  readonly notificacoes = computed<Notificacao[]>(() => {
    const p = this.contexto.painel();
    if (!p) return [];
    const nome = p.filho.primeiroNome;
    const lista: Notificacao[] = p.tarefas
      .filter((t) => t.situacao !== 'concluida' && !!t.dataEntrega && t.dataEntrega <= hojeIso())
      .map((t) => {
        const atrasada = t.dataEntrega! < hojeIso();
        return {
          chave: `tarefa-${p.filho.id}-${t.id}-${t.situacao}`,
          cor: atrasada ? 'vermelho' : t.situacao === 'em-andamento' ? 'verde' : 'laranja',
          titulo: tituloCompleto(t),
          texto:
            t.situacao === 'em-andamento'
              ? `${nome} já fez ${t.passosFeitos} de ${t.totalPassos} passos.`
              : `${nome} ainda não começou.`,
          quando: atrasada
            ? 'Atrasada'
            : t.horaLimite
              ? `Prazo hoje às ${horaCurta(t.horaLimite)}`
              : 'Para hoje',
        };
      });
    if (p.avisosNaoLidos)
      lista.push({
        chave: `avisos-${p.filho.id}-${p.avisosNaoLidos}`,
        cor: 'cinza',
        titulo: 'Avisos da escola',
        texto:
          p.avisosNaoLidos === 1
            ? 'Você tem 1 aviso não lido.'
            : `Você tem ${p.avisosNaoLidos} avisos não lidos.`,
        quando: 'Abra "Avisos da Escola"',
      });
    return lista;
  });
}

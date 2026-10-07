import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  ConfigPainel,
  Notificacao,
  PainelLayout,
} from '../../shared/painel-layout/painel-layout';
import { EscolaContexto } from './escola-contexto';
import { iniciais, ROTULO_PLANO } from '../adm/escola-ui';
import { juntar } from './escola-ui';

const ICONE = 'assets/escola/menu-';

/** Moldura das telas "Escola - ..." do Figma. */
@Component({
  selector: 'app-escola-layout',
  imports: [RouterOutlet, PainelLayout],
  template: `
    <app-painel-layout [config]="config()" [notificacoes]="notificacoes()">
      <router-outlet />
    </app-painel-layout>
  `,
  providers: [EscolaContexto],
})
export class EscolaLayout {
  private contexto = inject(EscolaContexto);

  readonly config = computed<ConfigPainel>(() => {
    const escola = this.contexto.escola();

    return {
      titulo: escola?.nome ?? 'Painel da escola',
      detalhe: escola ? `Plano ${ROTULO_PLANO[escola.plano]} - ${escola.ativo ? 'Ativo' : 'Inativo'}` : '',
      tituloPequeno: true,
      medidas: { rotuloX: 41, visaoX: 12, secaoTam: 32, gapItens: 15 },
      secoes: [
        {
          titulo: 'MENU',
          itens: [
            { rota: '/escola', rotulo: 'Visão geral', icone: 'visao' },
            { rota: '/escola/turmas', rotulo: 'Turmas', exato: false, icone: [{ src: ICONE + 'turmas', left: 11.15, top: 16.2 }] },
            { rota: '/escola/professores', rotulo: 'Professores', exato: false, icone: [{ src: ICONE + 'professores', left: 11.9, top: 16 }] },
            {
              rota: '/escola/alunos',
              rotulo: 'Alunos NEE',
              exato: false,
              icone: [
                { src: ICONE + 'alunos', left: 13.75, top: 14.75 },
                { src: ICONE + 'alunos-check', left: 25, top: 21 },
              ],
            },
            { rota: '/escola/relatorios', rotulo: 'Relatórios', icone: [{ src: ICONE + 'relatorios', left: 10.9, top: 14, espelhar: true }] },
          ],
        },
        {
          titulo: 'CADASTRO',
          itens: [
            { rota: '/escola/cadastro/aluno', rotulo: 'Aluno (a)', icone: [{ src: ICONE + 'cad-aluno', left: 11.9, top: 15 }] },
            { rota: '/escola/cadastro/professor', rotulo: 'Professor (a)', icone: [{ src: ICONE + 'cad-professor', left: 11.9, top: 13.7 }] },
          ],
        },
      ],
      conta: {
        iniciais: escola ? iniciais(escola.nome) : 'ES',
        nome: escola?.nome ?? 'Escola',
        detalhe: escola?.responsavel ? `Coordenação - ${escola.responsavel}` : 'Coordenação',
        links: [
          { rota: '/escola', rotulo: 'Painel da escola' },
          { rota: '/escola/relatorios', rotulo: 'Relatórios' },
        ],
      },
    };
  });

  readonly notificacoes = computed<Notificacao[]>(() => {
    const lista: Notificacao[] = this.contexto
      .professores()
      .filter((p) => p.status === 'pendente')
      .map((p) => ({
        chave: `p${p.id}`,
        cor: 'laranja',
        titulo: 'Novo cadastro pendente',
        texto: `${p.nome} ainda não ativou o acesso à Linka.`,
        quando: 'Aguardando primeiro login',
      }));

    const atencao = this.contexto.alunos().filter((a) => a.situacao === 'atencao');
    if (atencao.length) {
      const nomes = atencao.slice(0, 3).map((a) => a.nome.split(' ')[0]);
      lista.push({
        chave: `a${atencao.map((a) => a.id).join('-')}`,
        cor: 'vermelho',
        titulo: `${atencao.length} ${atencao.length === 1 ? 'aluno precisa' : 'alunos precisam'} de atenção`,
        texto: `${juntar(nomes)}${atencao.length > 3 ? ' e outros' : ''} ${atencao.length === 1 ? 'está' : 'estão'} abaixo de 50% esta semana.`,
        quando: 'Esta semana',
      });
    }

    return lista;
  });
}

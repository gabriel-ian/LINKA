import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import {
  ConfigPainel,
  Notificacao,
  PainelLayout,
} from '../../../shared/painel-layout/painel-layout';
import { EscolasStore } from '../escolas.store';
import { dataBr } from '../escola-ui';

const ICONE = 'assets/adm/menu-';

/** Moldura do "Painel administrativo" do Figma. */
@Component({
  selector: 'app-adm-layout',
  imports: [RouterOutlet, PainelLayout],
  template: `
    <app-painel-layout [config]="config()" [notificacoes]="notificacoes()">
      <router-outlet />
    </app-painel-layout>
  `,
  providers: [EscolasStore],
})
export class AdmLayout {
  private store = inject(EscolasStore);
  private router = inject(Router);
  private email = inject(AuthService).email ?? '';

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** A busca por ID fica dentro de "Buscar Escola"; o detalhe acende esse item. */
  readonly config = computed<ConfigPainel>(() => ({
    titulo: 'Painel administrativo',
    medidas: { rotuloX: 44, visaoX: 18, secaoTam: 36, gapItens: 16 },
    secoes: [
      {
        titulo: 'MENU',
        itens: [
          { rota: '/adm', rotulo: 'Visão geral', icone: 'visao' },
          {
            rota: '/adm/escolas/cadastrar',
            rotulo: 'Cadastrar Escola',
            icone: [{ src: ICONE + 'cadastrar', left: 17, top: 14 }],
          },
          {
            rota: '/adm/escolas',
            rotulo: 'Listar Escola',
            icone: [{ src: ICONE + 'listar', left: 17, top: 15 }],
          },
          {
            rota: '/adm/escolas/buscar',
            rotulo: 'Buscar Escola',
            selecionado: this.url().startsWith('/adm/escolas/id'),
            icone: [{ src: ICONE + 'buscar', left: 17, top: 12 }],
          },
          {
            rota: '/adm/escolas/atualizar',
            rotulo: 'Atualizar Escola',
            icone: [{ src: ICONE + 'atualizar', left: 18.5, top: 14.5 }],
          },
          {
            rota: '/adm/escolas/desativar',
            rotulo: 'Desativar Escola',
            icone: [{ src: ICONE + 'desativar', left: 18, top: 13 }],
          },
          {
            rota: '/adm/escolas/reativar',
            rotulo: 'Reativar Escola',
            icone: [
              { src: ICONE + 'atualizar', left: 18.5, top: 14.5 },
              { src: ICONE + 'reativar-traco', left: 20.27, top: 20.72, girar: -33.69 },
            ],
          },
        ],
      },
    ],
    conta: {
      iniciais: 'AD',
      nome: 'Administrador Linka',
      detalhe: this.email,
      links: [
        { rota: '/adm', rotulo: 'Visão geral' },
        { rota: '/adm/escolas', rotulo: 'Escolas cadastradas' },
      ],
    },
  }));

  readonly notificacoes = computed<Notificacao[]>(() => [
    ...this.store.pendentes().map((e) => ({
      chave: `p${e.id}`,
      cor: 'laranja' as const,
      titulo: 'Novo cadastro pendente',
      texto: `${e.nome} aguarda o primeiro acesso da coordenação.`,
      quando: `Cadastrada em ${dataBr(e.criado_em)}`,
    })),
    ...this.store.inativas().map((e) => ({
      chave: `i${e.id}`,
      cor: 'cinza' as const,
      titulo: 'Escola desativada',
      texto: e.motivoDesativacao
        ? `${e.nome} foi desativada (${e.motivoDesativacao.toLowerCase()}).`
        : `${e.nome} foi desativada.`,
      quando: dataBr(e.desativadaEm),
    })),
  ]);
}

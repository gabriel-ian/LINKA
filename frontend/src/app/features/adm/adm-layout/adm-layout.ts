import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { EscolasStore } from '../escolas.store';
import { dataBr } from '../escola-ui';

type IconeMenu =
  | 'visao'
  | 'cadastrar'
  | 'listar'
  | 'buscar'
  | 'id'
  | 'atualizar'
  | 'desativar'
  | 'reativar';

interface Notificacao {
  chave: string;
  cor: 'laranja' | 'cinza';
  titulo: string;
  texto: string;
  quando: string;
}

/** Moldura do "Painel administrativo" do Figma: topo, barra, menu e overlays. */
@Component({
  selector: 'app-adm-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './adm-layout.html',
  styleUrl: './adm-layout.css',
  providers: [EscolasStore],
})
export class AdmLayout {
  private auth = inject(AuthService);
  private router = inject(Router);
  private store = inject(EscolasStore);

  readonly menu: { rota: string; rotulo: string; icone: IconeMenu }[] = [
    { rota: '/adm', rotulo: 'Visão geral', icone: 'visao' },
    { rota: '/adm/escolas/cadastrar', rotulo: 'Cadastrar Escola', icone: 'cadastrar' },
    { rota: '/adm/escolas', rotulo: 'Listar Escola', icone: 'listar' },
    { rota: '/adm/escolas/buscar', rotulo: 'Buscar Escola', icone: 'buscar' },
    { rota: '/adm/escolas/id', rotulo: 'Buscar ID Escola', icone: 'id' },
    { rota: '/adm/escolas/atualizar', rotulo: 'Atualizar Escola', icone: 'atualizar' },
    { rota: '/adm/escolas/desativar', rotulo: 'Desativar Escola', icone: 'desativar' },
    { rota: '/adm/escolas/reativar', rotulo: 'Reativar Escola', icone: 'reativar' },
  ];

  readonly email = this.auth.email;
  readonly painel = signal<'conta' | 'notificacoes' | null>(null);
  private readonly lidas = signal<Set<string>>(new Set());

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

  readonly naoLidas = computed(
    () => this.notificacoes().filter((n) => !this.lidas().has(n.chave)).length,
  );

  ehLida(n: Notificacao): boolean {
    return this.lidas().has(n.chave);
  }

  marcarTodasComoLidas(): void {
    this.lidas.set(new Set(this.notificacoes().map((n) => n.chave)));
  }

  alternar(qual: 'conta' | 'notificacoes'): void {
    this.painel.update((atual) => (atual === qual ? null : qual));
  }

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

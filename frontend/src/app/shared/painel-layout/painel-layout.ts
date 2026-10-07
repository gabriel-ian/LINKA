import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/** Uma camada de icone do menu, na posicao do Figma (relativa a borda externa do botao). */
export interface CamadaIcone {
  /** Caminho sem extensao; a versao ativa e `${src}-ativo.svg`. */
  src: string;
  left: number;
  top: number;
  espelhar?: boolean;
  girar?: number;
}

export interface ItemMenu {
  rota: string;
  rotulo: string;
  /** 'visao' = os quatro retangulos do icone "Visao geral". */
  icone: CamadaIcone[] | 'visao';
  /** false: fica ativo tambem nas sub-rotas (ex.: Turmas no detalhe da turma). */
  exato?: boolean;
}

export interface ConfigPainel {
  titulo: string;
  /** Texto menor ao lado do titulo (ex.: "Plano Institucional - Ativo"). */
  detalhe?: string;
  /** Escola usa 32px em caixa alta; ADM usa 36px. */
  tituloPequeno?: boolean;
  secoes: { titulo: string; itens: ItemMenu[] }[];
  conta: {
    iniciais: string;
    nome: string;
    detalhe: string;
    links: { rota: string; rotulo: string }[];
  };
  /** Medidas que mudam entre os paineis do Figma. */
  medidas: { rotuloX: number; visaoX: number; secaoTam: number; gapItens: number };
}

export interface Notificacao {
  chave: string;
  cor: 'laranja' | 'cinza' | 'vermelho' | 'verde';
  titulo: string;
  texto: string;
  quando: string;
}

/**
 * Moldura comum dos paineis (ADM, Escola...): topo com foto, barra com
 * titulo, menu lateral, overlays de conta e notificacoes. O conteudo da
 * pagina entra por <ng-content>.
 */
@Component({
  selector: 'app-painel-layout',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './painel-layout.html',
  styleUrl: './painel-layout.css',
  host: {
    '[style.--rotulo-x.px]': 'config().medidas.rotuloX',
    '[style.--visao-x.px]': 'config().medidas.visaoX',
    '[style.--secao-tam.px]': 'config().medidas.secaoTam',
    '[style.--gap-itens.px]': 'config().medidas.gapItens',
  },
})
export class PainelLayout {
  private auth = inject(AuthService);
  private router = inject(Router);

  config = input.required<ConfigPainel>();
  notificacoes = input<Notificacao[]>([]);

  readonly painel = signal<'conta' | 'notificacoes' | null>(null);
  private readonly lidas = signal<Set<string>>(new Set());

  readonly naoLidas = computed(
    () => this.notificacoes().filter((n) => !this.lidas().has(n.chave)).length,
  );

  private readonly ativoExato = {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  } as const;

  private readonly ativoSubrotas = { ...this.ativoExato, paths: 'subset' } as const;

  opcoesAtivo(item: ItemMenu) {
    return item.exato === false ? this.ativoSubrotas : this.ativoExato;
  }

  camadas(item: ItemMenu): CamadaIcone[] {
    return item.icone === 'visao' ? [] : item.icone;
  }

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

import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AlterarSenha } from '../senha/alterar-senha';
import { DialogoService } from '../../core/services/dialogo.service';
import { VozService } from '../../core/services/voz.service';
import { MascoteDesenho } from '../mascote/mascote';
import { Mascote } from '../../core/model/painel-aluno.model';

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
  /** Destaca o item mesmo fora da rota dele (ex.: turma selecionada do professor). */
  selecionado?: boolean;
  /** Bolinha laranja com um numero (ex.: tarefas pendentes do aluno). */
  contador?: number;
  /** Rotulo longo: a bolinha sai para o canto do botao para nao cobrir o texto. */
  contadorNoCanto?: boolean;
  /** Item sem rota (ex.: escolher o filho na familia): vira um botao. */
  aoClicar?: () => void;
  /** 'filho': estilo laranja do item "FILHO (A)" da familia. */
  tom?: 'filho';
}

/** Icones da barra de abas do celular (desenhados em SVG no template). */
export type IconeAba =
  'inicio' | 'tarefas' | 'progresso' | 'perfil' | 'avisos' | 'relatorios' | 'ajustes';

/** Aba da barra inferior que aparece so no celular (Figma "Mobile - ..."). */
export interface Aba {
  rota: string;
  rotulo: string;
  icone: IconeAba;
  /** false: fica ativa tambem nas sub-rotas (ex.: Tarefas no passo da tarefa). */
  exato?: boolean;
}

/** Icones da segunda linha do cartao da barra (desenhados em SVG no template). */
export type IconeInfo =
  'escola' | 'livro' | 'pessoa' | 'turma' | 'plano' | 'email' | 'filho' | 'status';

/** Uma informacao da segunda linha do cartao (ex.: escola, disciplinas, turma). */
export interface InfoBarra {
  icone: IconeInfo;
  texto: string;
  /** 'ok' verde e 'alerta' laranja (ex.: escola ativa/inativa). */
  tom?: 'ok' | 'alerta';
}

export interface ConfigPainel {
  /** Nome de quem esta logado (pessoa, escola ou familia). */
  titulo: string;
  /** Etiqueta do perfil ao lado do nome (ex.: "Escola", "Professor(a)"). */
  perfil?: string;
  /** Informacoes com icone ao lado do nome, na barra. */
  infos?: InfoBarra[];
  /** Tela "Meu perfil" (botao no canto direito da barra). */
  perfilRota?: string;
  secoes: { titulo: string; itens: ItemMenu[] }[];
  conta: {
    iniciais: string;
    nome: string;
    detalhe: string;
    links: { rota: string; rotulo: string }[];
  };
  /** Medidas que mudam entre os paineis do Figma. */
  medidas: { rotuloX: number; visaoX: number; secaoTam: number; gapItens: number };
  /** Aluno: o mascote fala na barra, ao lado do cartao (com botao de ouvir). */
  fala?: string;
  /** Aluno: qual mascote fala (desenho e cores). */
  mascote?: Mascote;
  /** Aluno/familia: barra de abas no rodape, so no celular. */
  abas?: Aba[];
  /** Preferencias do aluno que mudam a moldura inteira. */
  modoCalmo?: boolean;
  letrasMaiores?: boolean;
  fonteDislexia?: boolean;
  altoContraste?: boolean;
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
  imports: [RouterLink, RouterLinkActive, AlterarSenha, MascoteDesenho],
  templateUrl: './painel-layout.html',
  styleUrl: './painel-layout.css',
  host: {
    '[style.--rotulo-x.px]': 'config().medidas.rotuloX',
    '[style.--visao-x.px]': 'config().medidas.visaoX',
    '[style.--secao-tam.px]': 'config().medidas.secaoTam',
    '[style.--gap-itens.px]': 'config().medidas.gapItens',
    '[class.calmo]': 'config().modoCalmo',
    '[class.letras-maiores]': 'config().letrasMaiores',
    '[class.fonte-dislexia]': 'config().fonteDislexia',
    '[class.alto-contraste]': 'config().altoContraste',
  },
})
export class PainelLayout {
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly voz = inject(VozService);
  private dialogo = inject(DialogoService);

  config = input.required<ConfigPainel>();
  notificacoes = input<Notificacao[]>([]);

  readonly painel = signal<'conta' | 'notificacoes' | null>(null);
  /** Gaveta do menu em telas estreitas (abaixo de 1000px). */
  readonly menuAberto = signal(false);
  readonly alterandoSenha = signal(false);
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

  /** Na gaveta, escolher um item ja fecha o menu. */
  fecharMenuSeLink(evento: Event): void {
    if ((evento.target as HTMLElement).closest('a')) this.menuAberto.set(false);
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

  async sair(): Promise<void> {
    this.painel.set(null);
    const sim = await this.dialogo.confirmar({
      titulo: 'Sair da conta?',
      mensagem: 'Você vai precisar entrar de novo com e-mail e senha para usar a Linka.',
      confirmar: 'Sim, sair',
      cancelar: 'Continuar aqui',
    });
    if (!sim) return;
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

import { Component, computed, input } from '@angular/core';
import { Mascote } from '../../core/model/painel-aluno.model';

export interface InfoMascote {
  id: Mascote;
  nome: string;
  letra: string;
  jeito: string;
  /** Cor do desenho e do texto da fala. */
  cor: string;
  /** Fundo do balao de fala. */
  corClara: string;
  /** Fundo da cena (cartao do Inicio). */
  corFundo: string;
  /** Tom da voz (pitch): Dino mais agudo, Robo mais grave. */
  tom: number;
}

/** Os mascotes que o aluno escolhe em "Meu perfil". */
export const MASCOTES: InfoMascote[] = [
  {
    id: 'dino',
    nome: 'Dino',
    letra: 'D',
    jeito: 'animado e divertido',
    cor: '#00704d',
    corClara: '#b8d7cd',
    corFundo: '#e3f3ec',
    tom: 1.2,
  },
  {
    id: 'coruja',
    nome: 'Coruja',
    letra: 'C',
    jeito: 'calma e sabida',
    cor: '#8a4b12',
    corClara: '#f6dcb5',
    corFundo: '#fdf1df',
    tom: 0.95,
  },
  {
    id: 'robo',
    nome: 'Robô',
    letra: 'R',
    jeito: 'direto e organizado',
    cor: '#1d4ed8',
    corClara: '#c7d7fb',
    corFundo: '#e6eeff',
    tom: 0.7,
  },
];

export function infoMascote(id: Mascote | null | undefined): InfoMascote {
  return MASCOTES.find((m) => m.id === id) ?? MASCOTES[0];
}

/**
 * Desenho do mascote do aluno (mesmo traco do Dino do Figma), na cor dele.
 * O tamanho vem do CSS de quem usa (largura e altura do host).
 */
@Component({
  selector: 'app-mascote',
  template: `
    <svg viewBox="0 0 33 33" fill="none" aria-hidden="true" [style.color]="cor() ?? info().cor">
      @switch (tipo()) {
        @case ('coruja') {
          <g stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
            <path d="M6.5 13 5.5 3.5 11.5 8.2Q16.5 6.3 21.5 8.2L27.5 3.5 26.5 13" />
            <path d="M6.5 13C4.6 24 9.5 31 16.5 31S28.4 24 26.5 13" />
            <circle cx="11.8" cy="15" r="4.2" />
            <circle cx="21.2" cy="15" r="4.2" />
            <path d="M12 31.2v1M21 31.2v1" />
          </g>
          <circle cx="12.3" cy="15.4" r="1.7" fill="currentColor" />
          <circle cx="20.7" cy="15.4" r="1.7" fill="currentColor" />
          <path d="M14.8 20.4h3.4l-1.7 3.2z" fill="currentColor" />
          <path
            d="M9.5 24.5q2 1.6 3.5 0M19.9 24.5q2 1.6 3.5 0"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        }
        @case ('robo') {
          <g stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">
            <rect x="5.5" y="9.5" width="22" height="17" rx="4" />
            <path d="M16.5 9.5V5" />
            <path d="M12 21.5h9" />
            <path d="M11 26.5v4h11v-4" />
          </g>
          <circle cx="16.5" cy="3.4" r="2" fill="currentColor" />
          <rect x="1.6" y="14.5" width="3" height="7" rx="1.2" fill="currentColor" />
          <rect x="28.4" y="14.5" width="3" height="7" rx="1.2" fill="currentColor" />
          <circle cx="12" cy="16" r="2.3" fill="currentColor" />
          <circle cx="21" cy="16" r="2.3" fill="currentColor" />
        }
        @default {
          <path
            fill="currentColor"
            d="M31.383 17.721C32.3235 17.49 32.9835 16.6485 32.9835 15.675C32.9835 14.7015 32.3235 13.86 31.383 13.629L29.6835 13.2C29.6835 11.3685 29.172 9.669 28.314 8.2005L29.04 7.1115C29.5845 6.303 29.502 5.2305 28.842 4.521C28.182 3.8115 27.126 3.63 26.2845 4.0755L24.981 4.785C23.463 3.8445 21.6975 3.3 19.8 3.3L19.371 1.6005C19.14 0.66 18.2985 0 17.325 0C16.3515 0 15.51 0.66 15.279 1.6005L14.85 3.3H10.725C4.818 3.3 0 8.118 0 14.025C0 19.932 4.818 24.75 10.725 24.75H11.55V31.35C11.55 32.2575 12.2925 33 13.2 33H28.05C28.9575 33 29.7 32.2575 29.7 31.35V28.05L31.3995 27.621C32.34 27.39 33 26.5485 33 25.575C33 24.6015 32.34 23.76 31.3995 23.529L29.7 23.1V18.15L31.3995 17.721H31.383ZM26.3835 29.7H14.8335V24.75H19.7835V21.45H10.7085C6.6165 21.45 3.2835 18.117 3.2835 14.025C3.2835 9.933 6.6165 6.6 10.7085 6.6H19.7835C23.43 6.6 26.3835 9.5535 26.3835 13.2V29.7Z"
          />
          <path
            fill="currentColor"
            d="M16.9978 10.2414C16.3754 10.2414 15.7784 10.4812 15.3383 10.908C14.8981 11.3348 14.6509 11.9136 14.6509 12.5172C14.6509 13.1208 14.8981 13.6997 15.3383 14.1265C15.7784 14.5533 16.3754 14.7931 16.9978 14.7931C17.6203 14.7931 18.2173 14.5533 18.6574 14.1265C19.0976 13.6997 19.3448 13.1208 19.3448 12.5172C19.3448 11.9136 19.0976 11.3348 18.6574 10.908C18.2173 10.4812 17.6203 10.2414 16.9978 10.2414ZM7.60991 11.7586C7.40243 11.7586 7.20344 11.8385 7.05672 11.9808C6.91001 12.1231 6.82759 12.316 6.82759 12.5172C6.82759 12.7184 6.91001 12.9114 7.05672 13.0537C7.20344 13.1959 7.40243 13.2759 7.60991 13.2759C7.8174 13.2759 8.01639 13.1959 8.1631 13.0537C8.30982 12.9114 8.39224 12.7184 8.39224 12.5172C8.39224 12.316 8.30982 12.1231 8.1631 11.9808C8.01639 11.8385 7.8174 11.7586 7.60991 11.7586Z"
          />
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      width: 33px;
      height: 33px;
    }

    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
  `,
})
export class MascoteDesenho {
  readonly tipo = input<Mascote>('dino');
  /** Outra cor (ex.: a do botao onde o mascote aparece). */
  readonly cor = input<string | null>(null);
  readonly info = computed(() => infoMascote(this.tipo()));
}

import { Component, computed, input } from '@angular/core';

export type PerfilEntrada = 'aluno' | 'familia' | 'professor' | 'escola';

interface IconeCamada {
  arquivo: string;
  left: number;
  top: number;
}

/** Posicao de cada camada do icone dentro do cartao 120x90, como no Figma. */
const ICONES: Record<PerfilEntrada, { rotulo: string; camadas: IconeCamada[] }> = {
  aluno: {
    rotulo: 'Aluno',
    camadas: [
      { arquivo: 'icone-aluno-a', left: 43.5, top: 22.5 },
      { arquivo: 'icone-aluno-b', left: 49.5, top: 30.9 },
    ],
  },
  familia: {
    rotulo: 'Família',
    camadas: [
      { arquivo: 'icone-familia-a', left: 45.5, top: 18.5 },
      { arquivo: 'icone-familia-b', left: 55.2, top: 31 },
    ],
  },
  professor: {
    rotulo: 'Professor',
    camadas: [{ arquivo: 'icone-professor', left: 44.5, top: 21.5 }],
  },
  escola: {
    rotulo: 'Escola',
    camadas: [{ arquivo: 'icone-escola', left: 45.5, top: 19.5 }],
  },
};

/** Componente "Seletor de perfil" do Figma (estados padrao e selecionado). */
@Component({
  selector: 'app-seletor-perfil',
  templateUrl: './seletor-perfil.html',
  styleUrl: './seletor-perfil.css',
  host: { '[class.ativo]': 'ativo()' },
})
export class SeletorPerfil {
  perfil = input.required<PerfilEntrada>();
  ativo = input(false);

  rotulo = computed(() => ICONES[this.perfil()].rotulo);

  camadas = computed(() =>
    ICONES[this.perfil()].camadas.map((c) => ({
      ...c,
      src: `assets/entrada/${c.arquivo}${this.ativo() ? '-ativo' : ''}.svg`,
    })),
  );
}

export const ROTULO_PERFIL: Record<PerfilEntrada, string> = {
  aluno: ICONES.aluno.rotulo,
  familia: ICONES.familia.rotulo,
  professor: ICONES.professor.rotulo,
  escola: ICONES.escola.rotulo,
};

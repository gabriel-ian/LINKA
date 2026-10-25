import { Component, input, signal } from '@angular/core';
import { AlterarSenha } from '../senha/alterar-senha';

/**
 * Moldura das telas "Meu perfil" (ADM, escola, professor e familia): cartao
 * com iniciais, nome, perfil e e-mail, botao de alterar a senha e, embaixo,
 * os blocos de informacao de cada perfil (ng-content).
 */
@Component({
  selector: 'app-perfil-pagina',
  imports: [AlterarSenha],
  template: `
    <div class="pagina">
      <header class="painel-cabecalho">
        <h1>Meu perfil</h1>
        @if (subtitulo()) {
          <p>{{ subtitulo() }}</p>
        }
      </header>

      <section class="cartao perfil-topo" aria-label="Quem está conectado">
        <span class="perfil-iniciais" aria-hidden="true">{{ iniciais() }}</span>
        <div class="perfil-quem">
          <h2>
            {{ nome() }}
            <span class="perfil-etiqueta">{{ perfil() }}</span>
          </h2>
          @if (email()) {
            <p>{{ email() }}</p>
          }
        </div>
        <button type="button" class="bt bt-secundario" (click)="alterandoSenha.set(true)">
          Alterar minha senha
        </button>
      </section>

      <ng-content />
    </div>

    @if (alterandoSenha()) {
      <app-alterar-senha (fechar)="alterandoSenha.set(false)" />
    }
  `,
  styles: `
    .pagina {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-width: var(--largura-pagina);
    }

    .perfil-topo {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 20px;
      padding: 22px 24px;
    }

    .perfil-iniciais {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 76px;
      height: 76px;
      border-radius: 50%;
      background: var(--cor-primaria-clara);
      color: var(--cor-primaria-escura);
      font-size: 26px;
      font-weight: 700;
    }

    .perfil-quem {
      flex: 1;
      min-width: 0;
    }

    .perfil-quem h2 {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 12px;
      margin: 0;
      color: var(--cor-titulo);
      font-size: 26px;
      font-weight: 700;
    }

    .perfil-quem p {
      margin: 6px 0 0;
      font-size: 17px;
    }

    .perfil-etiqueta {
      padding: 3px 12px;
      border-radius: 59px;
      background: var(--cor-primaria-clara);
      color: var(--cor-primaria-escura);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    @media (max-width: 700px) {
      .perfil-topo {
        flex-wrap: wrap;
      }

      .perfil-topo .bt {
        width: 100%;
      }

      .perfil-iniciais {
        width: 56px;
        height: 56px;
        font-size: 20px;
      }

      .perfil-quem h2 {
        font-size: 21px;
      }
    }
  `,
})
export class PerfilPagina {
  readonly iniciais = input.required<string>();
  readonly nome = input.required<string>();
  readonly perfil = input.required<string>();
  readonly email = input<string | null>(null);
  readonly subtitulo = input('');

  readonly alterandoSenha = signal(false);
}

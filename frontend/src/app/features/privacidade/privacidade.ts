import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntradaLayout } from '../../shared/entrada-layout/entrada-layout';
import { TermoTexto } from '../../shared/termo/termo-texto';

/** Termo de uso e privacidade aberto a todos (link na tela de login). */
@Component({
  selector: 'app-privacidade',
  imports: [RouterLink, EntradaLayout, TermoTexto],
  template: `
    <app-entrada-layout>
      <div class="etapa">
        <h1 class="titulo">Privacidade e uso</h1>
        <app-termo-texto />
        <a class="btn btn-secundario btn-bloco" routerLink="/login">Voltar para o login</a>
      </div>
    </app-entrada-layout>
  `,
  styles: `
    .etapa {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin: 40px 0;
    }
    .titulo {
      margin: 0;
      font-size: 40px;
      font-weight: 400;
    }
  `,
})
export class Privacidade {}

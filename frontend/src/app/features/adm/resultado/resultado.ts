import { Component, input } from '@angular/core';

/** Cartao de conclusao ("ok" verde ou "!" laranja) com botoes projetados. */
@Component({
  selector: 'app-adm-resultado',
  template: `
    <section class="cartao resultado" role="status">
      <span class="selo" [class.alerta]="tipo() === 'alerta'">{{ tipo() === 'ok' ? 'ok' : '!' }}</span>
      <h2>{{ titulo() }}</h2>
      <p>{{ texto() }}</p>
      <div class="acoes centro"><ng-content /></div>
    </section>
  `,
  styles: `
    .resultado {
      align-items: center;
      gap: 0;
      padding: 44px 24px;
      text-align: center;
    }
    .selo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--cor-sucesso-fundo);
      color: var(--cor-sucesso);
      font-size: 28px;
      font-weight: 800;
    }
    .selo.alerta {
      background: var(--cor-alerta-fundo);
      color: var(--cor-alerta);
    }
    h2 {
      margin: 22px 0 18px;
      font-size: 26px;
      font-weight: 700;
      color: var(--cor-titulo);
    }
    p {
      max-width: 580px;
      margin: 0 0 16px;
      font-size: 15px;
      font-weight: 500;
    }
  `,
})
export class AdmResultado {
  tipo = input<'ok' | 'alerta'>('ok');
  titulo = input.required<string>();
  texto = input('');
}

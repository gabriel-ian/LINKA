import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EntradaLayout } from '../../shared/entrada-layout/entrada-layout';

/**
 * Pagina provisoria de aluno e familia ate as telas deles ficarem prontas
 * (etapas Familia e Aluno do Figma).
 */
@Component({
  selector: 'app-inicio',
  imports: [EntradaLayout],
  template: `
    <app-entrada-layout>
      <div class="etapa">
        <h1>Olá{{ aluno ? '' : ', família' }}!</h1>
        <p>
          @if (aluno) {
            Seu acesso à Linka está funcionando. Em breve suas tarefas, passo a passo, aparecem aqui.
          } @else {
            Seu acesso à Linka está funcionando. Em breve você vai acompanhar as tarefas e os avisos da escola por aqui.
          }
        </p>
        <button type="button" class="btn btn-primario btn-bloco" (click)="sair()">Sair</button>
      </div>
    </app-entrada-layout>
  `,
  styles: `
    .etapa {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 77px;
    }
    h1 {
      margin: 0;
      font-size: 48px;
      font-weight: 400;
    }
    p {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }
  `,
})
export class Inicio {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly aluno = this.auth.perfil === 'aluno';

  sair(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

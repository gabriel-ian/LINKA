import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { EntradaLayout } from '../../shared/entrada-layout/entrada-layout';

/**
 * "Esqueci minha senha". Com e-mail configurado no backend, a pessoa recebe
 * um link para criar uma senha nova; sem ele, a tela orienta a pedir a senha
 * a coordenacao da escola (ou a equipe Linka, no caso das escolas).
 */
@Component({
  selector: 'app-recuperar-senha',
  imports: [FormsModule, RouterLink, EntradaLayout],
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.css',
})
export class RecuperarSenha {
  private auth = inject(AuthService);

  /** null enquanto pergunta ao backend se ha envio de e-mail. */
  readonly porEmail = signal<boolean | null>(null);
  readonly enviado = signal(false);
  readonly enviando = signal(false);
  readonly erro = signal('');
  email = '';

  constructor() {
    this.auth.esqueciDisponivel().subscribe({
      next: (res) => this.porEmail.set(res.data.porEmail),
      error: () => this.porEmail.set(false),
    });
  }

  enviar(): void {
    this.erro.set('');
    if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) {
      this.erro.set('Digite o e-mail que você usa para entrar na Linka.');
      return;
    }
    this.enviando.set(true);
    this.auth.pedirLinkSenha(this.email.trim()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviado.set(true);
      },
      error: (e: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(
          e.status === 429
            ? 'Muitos pedidos seguidos. Espere um minuto e tente de novo.'
            : 'Não foi possível enviar agora. Tente de novo.',
        );
      },
    });
  }
}

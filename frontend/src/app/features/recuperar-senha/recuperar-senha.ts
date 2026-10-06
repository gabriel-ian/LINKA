import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EntradaLayout } from '../../shared/entrada-layout/entrada-layout';

/** "Entrada - Recuperar senha" do Figma. */
@Component({
  selector: 'app-recuperar-senha',
  imports: [FormsModule, RouterLink, EntradaLayout],
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.css',
})
export class RecuperarSenha {
  private router = inject(Router);
  private auth = inject(AuthService);

  email = '';
  erro = '';
  enviando = false;

  enviar(): void {
    this.erro = '';

    if (!this.email) {
      this.erro = 'Informe o e-mail cadastrado.';
      return;
    }

    this.enviando = true;

    this.auth.recuperarSenha(this.email).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/recuperar-senha/enviado'], {
          queryParams: { email: this.email },
        });
      },
      error: () => {
        this.enviando = false;
        this.erro = 'Não foi possível enviar o link agora. Tente novamente.';
      },
    });
  }
}

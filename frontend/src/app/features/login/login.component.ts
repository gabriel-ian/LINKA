import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { PerfilUsuario } from '../../core/model/escola.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  email = '';
  senha = '';

  /**
   * Continua existindo so como destaque visual dos botoes de perfil.
   * NAO e enviado ao backend: o perfil real vem da tabela usuario.
   */
  perfil = '';

  erro = '';
  carregando = false;

  login(): void {
    this.erro = '';

    if (!this.email || !this.senha) {
      this.erro = 'Preencha email e senha.';
      return;
    }

    this.carregando = true;

    this.auth.login(this.email, this.senha).subscribe({
      next: (res) => {
        this.carregando = false;

        if (!res?.access_token) {
          this.erro = 'Nao foi possivel entrar. Tente novamente.';
          return;
        }

        this.auth.guardarSessao(res);
        this.redirecionar(res.perfil);
      },

      error: (e: HttpErrorResponse) => {
        this.carregando = false;
        this.erro =
          e.status === 401
            ? 'Email ou senha invalidos.'
            : 'Erro ao conectar com o servidor.';
      },
    });
  }

  private redirecionar(perfil: PerfilUsuario): void {
    switch (perfil) {
      case 'admin':
      case 'escola':
        this.router.navigate(['/escolas']);
        break;

      default:
        // professor e responsavel ainda nao tem tela propria.
        this.router.navigate(['/dashboard']);
    }
  }
}

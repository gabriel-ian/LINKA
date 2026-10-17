import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

/** "ADM - Login" do Figma: acesso restrito, so contas com perfil admin. */
@Component({
  selector: 'app-adm-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './adm-login.html',
  styleUrl: './adm-login.css',
})
export class AdmLogin {
  private router = inject(Router);
  private auth = inject(AuthService);

  email = '';
  senha = '';
  mostrarSenha = false;
  erro = '';
  erroCredenciais = false;
  carregando = false;

  login(): void {
    this.erro = '';
    this.erroCredenciais = false;

    if (!this.email || !this.senha) {
      this.erro = 'Preencha e-mail e senha.';
      return;
    }

    this.carregando = true;

    this.auth.login(this.email, this.senha).subscribe({
      next: (res) => {
        this.carregando = false;

        if (res?.perfil !== 'admin') {
          this.erro = 'Esta conta não tem acesso de administrador.';
          return;
        }

        this.auth.guardarSessao(res);
        this.router.navigate(['/adm']);
      },

      error: (e: HttpErrorResponse) => {
        this.carregando = false;

        if (e.status === 401) {
          this.erroCredenciais = true;
          this.erro = 'E-mail ou senha incorretos. Confira os dados e tente de novo.';
        } else if (e.status === 403) {
          this.erro = 'O acesso desta escola está suspenso. Fale com a equipe Linka.';
        } else {
          this.erro = 'Erro ao conectar com o servidor.';
        }
      },
    });
  }
}

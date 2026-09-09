import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private router = inject(Router);
  private auth = inject(AuthService);

  email: string = '';
  senha: string = '';
  perfil: string = '';


  login() {

    // ❌ bloqueia se não preencher
    if (!this.email || !this.senha || !this.perfil) {
      alert('Preencha todos os campos');
      return;
    }

    this.auth.login(this.email, this.senha, this.perfil)
      .subscribe({

        next: (res: any) => {

          // 🔥 só entra aqui se login deu certo
          if (!res.access_token) {
            alert('Login inválido');
            return;
          }

          // salva token
          localStorage.setItem('token', res.access_token);

          const payload = JSON.parse(atob(res.access_token.split('.')[1]));
          const perfil = payload.perfil;

          // 🔥 redireciona corretamente
          if (perfil === 'admin') {
            this.router.navigate(['/escolas']);
          }

          if (perfil === 'escola') {
            this.router.navigate(['/escolas']);
          }

        },

        error: () => {
          // 🔥 se login falhar
          alert('Email ou senha inválidos');
        }

      });
  }
}

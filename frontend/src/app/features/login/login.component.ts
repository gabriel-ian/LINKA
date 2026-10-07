import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { PerfilUsuario } from '../../core/model/escola.model';
import { EntradaLayout } from '../../shared/entrada-layout/entrada-layout';
import {
  PerfilEntrada,
  ROTULO_PERFIL,
  SeletorPerfil,
} from '../../shared/seletor-perfil/seletor-perfil';

/** Perfil do backend que corresponde a cada botao. */
const PERFIL_BACKEND: Record<PerfilEntrada, PerfilUsuario> = {
  aluno: 'aluno',
  familia: 'responsavel',
  professor: 'professor',
  escola: 'escola',
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, EntradaLayout, SeletorPerfil],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private router = inject(Router);
  private auth = inject(AuthService);

  readonly perfis: PerfilEntrada[] = ['aluno', 'familia', 'professor', 'escola'];

  email = '';
  senha = '';

  /**
   * Usado so para conferir, depois do login, se a conta e do perfil escolhido.
   * NAO e enviado ao backend: o perfil real vem da tabela usuario.
   */
  perfil: PerfilEntrada | null = null;

  mostrarSenha = false;
  avisoPerfil = false;
  erro = '';
  /** Credenciais recusadas: os campos ficam com borda vermelha. */
  erroCredenciais = false;
  carregando = false;

  login(): void {
    this.erro = '';
    this.erroCredenciais = false;

    if (!this.perfil) {
      this.avisoPerfil = true;
      return;
    }

    if (!this.email || !this.senha) {
      this.erro = 'Preencha e-mail e senha.';
      return;
    }

    const perfilEscolhido = this.perfil;
    this.carregando = true;

    this.auth.login(this.email, this.senha).subscribe({
      next: (res) => {
        this.carregando = false;

        if (!res?.access_token) {
          this.erro = 'Não foi possível entrar. Tente novamente.';
          return;
        }

        if (res.perfil !== PERFIL_BACKEND[perfilEscolhido]) {
          this.erro = `Esta conta não é de ${ROTULO_PERFIL[perfilEscolhido]}. Selecione o perfil correto.`;
          return;
        }

        this.auth.guardarSessao(res);
        this.redirecionar(res.perfil);
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

  private redirecionar(perfil: PerfilUsuario): void {
    switch (perfil) {
      case 'admin':
        this.router.navigate(['/adm']);
        break;

      case 'escola':
        this.router.navigate(['/escola']);
        break;

      case 'professor':
        this.router.navigate(['/professor']);
        break;

      default:
        // responsavel e aluno ainda nao tem tela propria.
        this.router.navigate(['/dashboard']);
    }
  }
}

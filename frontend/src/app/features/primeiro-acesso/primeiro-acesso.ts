import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { rotaInicial } from '../../core/services/rota-inicial';
import { EntradaLayout } from '../../shared/entrada-layout/entrada-layout';

/**
 * Depois de entrar com a senha recebida (cadastro ou redefinicao), a pessoa
 * cria uma senha propria ou mantem a recebida. Os dois caminhos seguem para
 * a tela inicial do perfil.
 */
@Component({
  selector: 'app-primeiro-acesso',
  imports: [FormsModule, EntradaLayout],
  templateUrl: './primeiro-acesso.html',
  styleUrl: './primeiro-acesso.css',
})
export class PrimeiroAcesso {
  private auth = inject(AuthService);
  private router = inject(Router);

  nova = '';
  repetir = '';
  mostrarNova = false;
  mostrarRepetir = false;

  readonly erroNova = signal('');
  readonly erro = signal('');
  readonly salvando = signal(false);

  salvar(): void {
    this.erro.set('');
    this.erroNova.set(
      this.nova.length < 8
        ? 'A nova senha precisa de pelo menos 8 caracteres.'
        : this.nova !== this.repetir
          ? 'As senhas não coincidem.'
          : '',
    );
    if (this.erroNova()) return;

    this.salvando.set(true);
    this.auth.criarSenha(this.nova).subscribe({
      next: () => this.seguir(),
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        const msg = [e.error?.message].flat().join(' ');
        if (/diferente/i.test(msg)) {
          this.erroNova.set('A nova senha precisa ser diferente da que você recebeu.');
        } else if (/alterar senha/i.test(msg)) {
          // A senha ja foi trocada antes (ex.: outra aba): nada a fazer aqui.
          this.seguir();
        } else {
          this.erro.set('Não foi possível salvar a senha agora. Tente de novo.');
        }
      },
    });
  }

  manter(): void {
    this.erro.set('');
    this.salvando.set(true);
    this.auth.manterSenha().subscribe({
      next: () => this.seguir(),
      error: () => {
        this.salvando.set(false);
        this.erro.set('Não foi possível continuar agora. Tente de novo.');
      },
    });
  }

  private seguir(): void {
    this.router.navigateByUrl(rotaInicial(this.auth.perfil));
  }
}

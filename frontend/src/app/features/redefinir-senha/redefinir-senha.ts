import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { EntradaLayout } from '../../shared/entrada-layout/entrada-layout';

/** Link do e-mail "Criar uma nova senha" (/redefinir-senha?token=...). */
@Component({
  selector: 'app-redefinir-senha',
  imports: [FormsModule, RouterLink, EntradaLayout],
  templateUrl: './redefinir-senha.html',
  // Mesmo visual do primeiro acesso (campos de senha com o olho).
  styleUrl: '../primeiro-acesso/primeiro-acesso.css',
})
export class RedefinirSenha {
  private auth = inject(AuthService);
  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  nova = '';
  repetir = '';
  mostrarNova = false;
  mostrarRepetir = false;

  readonly erroNova = signal('');
  readonly erro = signal('');
  readonly salvando = signal(false);
  readonly concluido = signal(false);

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
    this.auth.redefinirSenha(this.token, this.nova).subscribe({
      next: () => {
        this.salvando.set(false);
        this.concluido.set(true);
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(
          e.status === 400
            ? 'Este link é inválido ou já venceu. Peça um link novo.'
            : e.status === 429
              ? 'Muitas tentativas seguidas. Espere um minuto e tente de novo.'
              : 'Não foi possível salvar a senha agora. Tente de novo.',
        );
      },
    });
  }
}

import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EntradaLayout } from '../../shared/entrada-layout/entrada-layout';

/** "Entrada - E-mail enviado" do Figma. O e-mail chega por query param. */
@Component({
  selector: 'app-email-enviado',
  imports: [RouterLink, EntradaLayout],
  templateUrl: './email-enviado.html',
  styleUrls: ['./recuperar-senha.css', './email-enviado.css'],
})
export class EmailEnviado {
  private auth = inject(AuthService);

  email = inject(ActivatedRoute).snapshot.queryParamMap.get('email') ?? '';
  mensagem = '';
  reenviando = false;

  reenviar(): void {
    if (!this.email || this.reenviando) return;

    this.reenviando = true;
    this.mensagem = '';

    this.auth.recuperarSenha(this.email).subscribe({
      next: () => {
        this.reenviando = false;
        this.mensagem = 'E-mail reenviado.';
      },
      error: () => {
        this.reenviando = false;
        this.mensagem = 'Não foi possível reenviar agora. Tente novamente.';
      },
    });
  }
}

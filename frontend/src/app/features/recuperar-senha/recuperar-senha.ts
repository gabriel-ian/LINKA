import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntradaLayout } from '../../shared/entrada-layout/entrada-layout';

/**
 * "Esqueci minha senha". A Linka nao envia e-mails: quem redefine a senha
 * e a coordenacao da escola (alunos, familias e professores) ou a equipe
 * Linka (escolas), pelos paineis.
 */
@Component({
  selector: 'app-recuperar-senha',
  imports: [RouterLink, EntradaLayout],
  templateUrl: './recuperar-senha.html',
  styleUrl: './recuperar-senha.css',
})
export class RecuperarSenha {}

import { Component, input } from '@angular/core';
import { AjudaEntrada } from '../ajuda-entrada/ajuda-entrada';

/**
 * Moldura das telas de entrada (login, recuperar senha, e-mail enviado):
 * coluna esquerda com o logo e o conteudo projetado, foto de girassois a direita.
 * No canto superior direito, a "Ajuda para ler" (letra, contraste e voz).
 */
@Component({
  selector: 'app-entrada-layout',
  imports: [AjudaEntrada],
  templateUrl: './entrada-layout.html',
  styleUrl: './entrada-layout.css',
})
export class EntradaLayout {
  /** Passo a passo da tela, lido pelo mascote em "Ouvir como entrar". */
  readonly instrucoes = input('');
}

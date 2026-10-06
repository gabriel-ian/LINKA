import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Escola } from '../../core/model/escola.model';
import { EscolaService } from '../../core/services/escola.service';

/**
 * Painel provisorio da escola logada (perfil escola/professor).
 * O CRUD de escolas do admin vive em features/adm.
 */
@Component({
  selector: 'app-escola-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './escola-list.html',
  styleUrl: './escola-list.css',
})
export class EscolaList implements OnInit {
  private escolaService = inject(EscolaService);

  escolas: Escola[] = [];
  erro = '';

  ngOnInit(): void {
    this.escolaService.minhaEscola().subscribe({
      next: (res) => (this.escolas = [res.data]),
      error: (e: HttpErrorResponse) => {
        this.erro =
          e.status === 403
            ? 'Seu perfil nao tem acesso a esta tela.'
            : 'Erro ao carregar a escola.';
      },
    });
  }
}

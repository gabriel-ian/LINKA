import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Escola } from '../../core/model/escola.model';
import { EscolaService } from '../../core/services/escola.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-escola-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './escola-list.html',
  styleUrl: './escola-list.css',
})
export class EscolaList implements OnInit {
  private escolaService = inject(EscolaService);
  private auth = inject(AuthService);

  escolas: Escola[] = [];
  nome = '';
  cnpj = '';
  editandoId: number | null = null;
  nomeEdicao = '';
  erro = '';

  get isAdmin(): boolean {
    return this.auth.perfil === 'admin';
  }

  ngOnInit(): void {
    this.carregar();
  }

  private carregar(): void {
    // Admin ve todas as escolas; escola e professor veem apenas a propria.
    const requisicao: Observable<ApiResponse<Escola | Escola[]>> = this
      .isAdmin
      ? this.escolaService.listar()
      : this.escolaService.minhaEscola();

    requisicao.subscribe({
      next: (res: any) => {
        this.escolas = Array.isArray(res.data) ? res.data : [res.data];
      },
      error: (e: HttpErrorResponse) => {
        this.erro =
          e.status === 403
            ? 'Seu perfil nao tem acesso a esta listagem.'
            : 'Erro ao carregar escolas.';
      },
    });
  }

  cadastrar(): void {
    if (!this.nome.trim()) return;

    this.escolaService
      .cadastrar(this.nome, this.cnpj.trim() || undefined)
      .subscribe({
        next: (res) => {
          this.escolas.push(res.data);
          this.nome = '';
          this.cnpj = '';
        },
        error: () => {
          this.erro = 'Erro ao cadastrar escola.';
        },
      });
  }

  editar(escola: Escola): void {
    this.editandoId = escola.id;
    this.nomeEdicao = escola.nome;
  }

  salvarEdicao(): void {
    if (this.editandoId === null || !this.nomeEdicao.trim()) return;

    this.escolaService.atualizar(this.editandoId, this.nomeEdicao).subscribe({
      next: (res) => {
        const atualizada = res.data;
        const indice = this.escolas.findIndex((e) => e.id === atualizada.id);

        if (indice !== -1) {
          this.escolas[indice] = atualizada;
        }

        this.editandoId = null;
        this.nomeEdicao = '';
      },
      error: () => {
        this.erro = 'Erro ao atualizar escola.';
      },
    });
  }

  desativar(escola: Escola): void {
    this.escolaService.desativar(escola.id).subscribe({
      next: () => (escola.ativo = false),
      error: () => (this.erro = 'Erro ao desativar escola.'),
    });
  }

  ativar(escola: Escola): void {
    this.escolaService.ativar(escola.id).subscribe({
      next: () => (escola.ativo = true),
      error: () => (this.erro = 'Erro ao reativar escola.'),
    });
  }
}

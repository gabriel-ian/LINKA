import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Escola } from '../../core/model/escola.model';
import { EscolaService } from '../../core/services/escola.service';

@Component({
  selector: 'app-escola-list',
  imports: [FormsModule],
  templateUrl: './escola-list.html',
  styleUrl: './escola-list.css',
})
export class EscolaList implements OnInit {
  escolas: Escola[] = [];
  nome: string = '';
  editandoId: number | null = null;
  nomeEdicao: string = '';

  constructor(private escolaService: EscolaService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');

    if (!token) {
      console.log('Usuário não logado');
      return;
    }

    this.escolaService.listar().subscribe({
      next: (res: any) => {

        this.escolas = Array.isArray(res.data)
          ? res.data
          : [res.data];

        console.log('Escolas recebidas:', res);
      },
      error: (erro: HttpErrorResponse) => {
        console.error('Erro ao buscar escolas:', erro);
      },
    });
  }

  cadastrar(): void {
    if (!this.nome.trim()) return;

    this.escolaService.cadastrar(this.nome).subscribe({
      next: (res: any) => {
        this.escolas.push(res.data); 
        this.nome = '';
      },
      error: (erro: HttpErrorResponse) => {
        console.error('Erro ao cadastrar escola:', erro);
      },
    });
  }

  editar(escola: Escola): void {
    this.editandoId = escola.id;
    this.nomeEdicao = escola.nome;
  }

  salvarEdicao(): void {
    if (this.editandoId === null || !this.nomeEdicao.trim()) return;

    this.escolaService
      .atualizar(this.editandoId, this.nomeEdicao)
      .subscribe({
        next: (res: any) => {
          const escolaAtualizada = res.data; 

          const indice = this.escolas.findIndex(
            e => e.id === escolaAtualizada.id
          );

          if (indice !== -1) {
            this.escolas[indice] = escolaAtualizada;
          }

          this.editandoId = null;
          this.nomeEdicao = '';
        },
        error: (erro: HttpErrorResponse) => {
          console.error('Erro ao atualizar escola:', erro);
        },
      });
  }

  desativar(escola: Escola): void {
    this.escolaService.desativar(escola.id).subscribe({
      next: () => {
        escola.ativo = false;
      },
      error: (erro: HttpErrorResponse) => {
        console.error('Erro ao desativar escola:', erro);
      },
    });
  }

  ativar(escola: Escola): void {
    this.escolaService.ativar(escola.id).subscribe({
      next: () => {
        escola.ativo = true;
      },
      error: (erro: HttpErrorResponse) => {
        console.error('Erro ao reativar escola:', erro);
      },
    });
  }
}
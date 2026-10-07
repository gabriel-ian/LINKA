import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { Opcoes, Turno } from '../../../core/model/painel-escola.model';
import { EscolaContexto } from '../escola-contexto';

const SERIES = [
  '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano', '6º Ano', '7º Ano', '8º Ano', '9º Ano',
  '1ª Série', '2ª Série', '3ª Série',
];

/** "Escola - Nova turma" do Figma. */
@Component({
  selector: 'app-escola-turma-nova',
  imports: [FormsModule, RouterLink],
  templateUrl: './turma-nova.html',
  styleUrl: './turma-nova.css',
})
export class EscolaTurmaNova {
  private service = inject(PainelEscolaService);
  private router = inject(Router);
  private contexto = inject(EscolaContexto);

  readonly series = SERIES;
  readonly anos = [0, 1].map((d) => new Date().getFullYear() + d);

  serie = '8º Ano';
  letra = '';
  turno: Turno = 'manha';
  anoLetivo = new Date().getFullYear();
  sala = '';
  limiteAlunos = '';

  readonly opcoes = signal<Opcoes | null>(null);
  readonly selecionados = signal<Set<number>>(new Set());
  readonly erro = signal('');
  readonly erroLetra = signal(false);
  readonly salvando = signal(false);

  constructor() {
    this.service.opcoes().subscribe({ next: (res) => this.opcoes.set(res.data) });
  }

  alternar(id: number): void {
    this.selecionados.update((s) => {
      const novo = new Set(s);
      novo.has(id) ? novo.delete(id) : novo.add(id);
      return novo;
    });
  }

  salvar(): void {
    this.erro.set('');
    this.erroLetra.set(!/^[A-Za-z0-9]{1,5}$/.test(this.letra.trim()));
    if (this.erroLetra()) return;

    const limite = this.limiteAlunos.trim();
    if (limite && !/^\d+$/.test(limite)) {
      this.erro.set('O limite de alunos deve ser um número.');
      return;
    }

    this.salvando.set(true);
    this.service
      .criarTurma({
        serie: this.serie,
        letra: this.letra.trim(),
        turno: this.turno,
        anoLetivo: Number(this.anoLetivo),
        sala: this.sala.trim() || undefined,
        limiteAlunos: limite ? Number(limite) : undefined,
        professorIds: [...this.selecionados()],
      })
      .subscribe({
        next: (res) => {
          this.contexto.recarregar();
          this.router.navigate(['/escola/turmas', res.data.id], { queryParams: { criada: 1 } });
        },
        error: (e: HttpErrorResponse) => {
          this.salvando.set(false);
          this.erro.set([e.error?.message].flat().join(' ') || 'Não foi possível salvar a turma.');
        },
      });
  }
}

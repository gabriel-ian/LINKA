import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { NovaTurma, Opcoes, Turno } from '../../../core/model/painel-escola.model';
import { EscolaContexto } from '../escola-contexto';

const SERIES = [
  '1º Ano',
  '2º Ano',
  '3º Ano',
  '4º Ano',
  '5º Ano',
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  '1ª Série',
  '2ª Série',
  '3ª Série',
];

/** "Escola - Nova turma" do Figma; com :id na rota, edita a turma. */
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

  /** Turma em edicao (rota /escola/turmas/:id/editar); null = nova. */
  readonly editandoId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;
  readonly carregado = signal(!this.editandoId);

  series = SERIES;
  anos = [0, 1].map((d) => new Date().getFullYear() + d);

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

    if (this.editandoId) {
      this.service.turma(this.editandoId).subscribe({
        next: ({ data: t }) => {
          this.serie = t.serie ?? this.serie;
          this.letra = t.letra ?? '';
          this.turno = t.turno ?? 'manha';
          this.anoLetivo = t.anoLetivo ?? this.anoLetivo;
          this.sala = t.sala ?? '';
          this.limiteAlunos = t.limiteAlunos?.toString() ?? '';
          this.selecionados.set(new Set(t.professores.map((p) => p.id)));
          if (!this.series.includes(this.serie)) this.series = [this.serie, ...this.series];
          if (!this.anos.includes(this.anoLetivo)) this.anos = [this.anoLetivo, ...this.anos];
          this.carregado.set(true);
        },
        error: () => this.erro.set('Turma não encontrada.'),
      });
    }
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
    const dados: NovaTurma = {
      serie: this.serie,
      letra: this.letra.trim(),
      turno: this.turno,
      anoLetivo: Number(this.anoLetivo),
      sala: this.sala.trim() || undefined,
      limiteAlunos: limite ? Number(limite) : undefined,
      professorIds: [...this.selecionados()],
    };
    // Na edicao, campos vazios vao como null para limpar.
    const requisicao = this.editandoId
      ? this.service.editarTurma(this.editandoId, {
          ...dados,
          sala: this.sala.trim() || null,
          limiteAlunos: limite ? Number(limite) : null,
        })
      : this.service.criarTurma(dados);

    requisicao.subscribe({
      next: (res) => {
        this.contexto.recarregar();
        const id = this.editandoId ?? (res as { data: { id: number } }).data.id;
        this.router.navigate(['/escola/turmas', id], {
          queryParams: this.editandoId ? { salva: 1 } : { criada: 1 },
        });
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set([e.error?.message].flat().join(' ') || 'Não foi possível salvar a turma.');
      },
    });
  }
}

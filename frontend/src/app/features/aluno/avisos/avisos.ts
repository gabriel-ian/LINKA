import { Component, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AvisoAluno } from '../../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { VozService } from '../../../core/services/voz.service';
import { AlunoContexto } from '../aluno-contexto';
import { Esqueleto } from '../../../shared/esqueleto/esqueleto';
import { MascoteDesenho } from '../../../shared/mascote/mascote';

const ROTULO: Record<AvisoAluno['tipo'], string> = {
  atividade: 'Atividade',
  evento: 'Evento',
  material: 'Material',
  aviso: 'Aviso',
};

/**
 * Avisos da turma para o aluno. Quem tem NEE ve primeiro a versao
 * simplificada (quando o professor pediu) e pode ouvir o aviso.
 */
@Component({
  selector: 'app-aluno-avisos',
  imports: [Esqueleto, DatePipe, MascoteDesenho],
  templateUrl: './avisos.html',
  styleUrl: './avisos.css',
})
export class AlunoAvisos {
  private service = inject(PainelAlunoService);
  readonly contexto = inject(AlunoContexto);
  readonly voz = inject(VozService);

  readonly avisos = signal<AvisoAluno[] | null>(null);
  readonly erro = signal('');
  /** Avisos abertos no texto original (em vez do simplificado). */
  readonly original = signal<Set<number>>(new Set());

  readonly novos = computed(() => this.avisos()?.filter((a) => !a.lido).length ?? 0);

  constructor() {
    this.service.avisos().subscribe({
      next: (res) => this.avisos.set(res.data.avisos),
      error: () => this.erro.set('Não foi possível carregar os avisos agora. Tente de novo.'),
    });

    effect(() => {
      const n = this.novos();
      this.contexto.fala.set(
        n
          ? `Você tem ${n === 1 ? '1 aviso novo' : n + ' avisos novos'} da escola.`
          : 'Aqui ficam os avisos da sua turma.',
      );
    });
  }

  rotulo(a: AvisoAluno): string {
    return ROTULO[a.tipo] ?? 'Aviso';
  }

  verOriginal(a: AvisoAluno): boolean {
    return !a.simplificada || this.original().has(a.id);
  }

  alternar(a: AvisoAluno): void {
    this.original.update((s) => {
      const novo = new Set(s);
      if (!novo.delete(a.id)) novo.add(a.id);
      return novo;
    });
  }

  ouvir(a: AvisoAluno): void {
    this.voz.falar(`${a.titulo}. ${a.texto}`);
    this.marcarLido(a);
  }

  marcarLido(a: AvisoAluno): void {
    if (a.lido) return;
    this.service.marcarAvisoLido(a.id).subscribe({
      next: () => {
        this.avisos.update((l) => l?.map((x) => (x.id === a.id ? { ...x, lido: true } : x)) ?? l);
        this.contexto.recarregar();
      },
    });
  }
}

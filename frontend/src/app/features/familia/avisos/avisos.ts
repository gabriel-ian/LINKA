import { Component, computed, effect, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Aviso, AvisosFamilia, TipoAviso } from '../../../core/model/painel-familia.model';
import { PainelFamiliaService } from '../../../core/services/painel-familia.service';
import { FamiliaContexto } from '../familia-contexto';
import { quandoFoi } from '../familia-ui';

const ROTULO: Record<TipoAviso, string> = {
  atividade: 'Atividade',
  evento: 'Evento',
  material: 'Material',
  aviso: 'Aviso',
};

/** "Familia - Avisos da escola" e "Avisos vazio" do Figma. */
@Component({
  selector: 'app-familia-avisos',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './avisos.html',
  styleUrls: ['../familia-comum.css', './avisos.css'],
})
export class FamiliaAvisos {
  readonly contexto = inject(FamiliaContexto);
  private service = inject(PainelFamiliaService);

  readonly dados = signal<AvisosFamilia | null>(null);
  readonly erro = signal('');
  readonly verAntigos = signal(false);
  /** Avisos com a versao simplificada aberta. */
  readonly simples = signal<Set<number>>(new Set());

  readonly naoLidos = computed(() => this.dados()?.avisos.filter((a) => !a.lido) ?? []);
  readonly lidos = computed(() => this.dados()?.avisos.filter((a) => a.lido) ?? []);

  constructor() {
    effect(() => {
      const id = this.contexto.filhoId();
      if (id === null) return;
      this.verAntigos.set(false);
      this.service.avisos(id).subscribe({
        next: (res) => {
          this.dados.set(res.data);
          this.erro.set('');
        },
        error: () => this.erro.set('Não foi possível carregar os avisos agora.'),
      });
    });
  }

  rotulo(a: Aviso): string {
    return ROTULO[a.tipo] ?? 'Aviso';
  }

  /** Icone do Figma; "aviso" usa o do evento. */
  icone(a: Aviso): string {
    const tipo = a.tipo === 'aviso' ? 'evento' : a.tipo;
    return `assets/familia/aviso-${tipo}${a.lido ? '-lido' : ''}.svg`;
  }

  quando(a: Aviso): string {
    return quandoFoi(a.enviadoEm);
  }

  alternarSimples(id: number): void {
    this.simples.update((s) => {
      const novo = new Set(s);
      if (!novo.delete(id)) novo.add(id);
      return novo;
    });
  }

  marcarLido(a: Aviso): void {
    this.service.marcarAvisoLido(a.id).subscribe({
      next: () => {
        this.dados.update((d) =>
          d ? { ...d, avisos: d.avisos.map((x) => (x.id === a.id ? { ...x, lido: true } : x)) } : d,
        );
        this.contexto.recarregarPainel();
      },
      error: () => this.erro.set('Não foi possível marcar o aviso como lido.'),
    });
  }
}

import { Component, computed, effect, inject, signal } from '@angular/core';
import { RelatorioFamilia } from '../../../core/model/painel-familia.model';
import { PainelFamiliaService } from '../../../core/services/painel-familia.service';
import { FamiliaContexto } from '../familia-contexto';
import { corMateria } from '../familia-ui';

/** "Familia - Relatorios" do Figma. O PDF sai pela impressao do navegador. */
@Component({
  selector: 'app-familia-relatorios',
  templateUrl: './relatorios.html',
  styleUrls: ['../familia-comum.css', './relatorios.css'],
})
export class FamiliaRelatorios {
  readonly contexto = inject(FamiliaContexto);
  private service = inject(PainelFamiliaService);
  readonly cor = corMateria;

  readonly mes = signal<string | undefined>(undefined);
  readonly dados = signal<RelatorioFamilia | null>(null);
  readonly erro = signal('');

  /** Altura das barras: a semana com mais tarefas iniciadas sozinho = 100%. */
  readonly maiorSemana = computed(() =>
    Math.max(1, ...(this.dados()?.iniciadasPorSemana.map((s) => s.sozinho) ?? [])),
  );

  constructor() {
    effect(() => {
      const id = this.contexto.filhoId();
      const mes = this.mes();
      if (id === null) return;
      this.service.relatorio(id, mes).subscribe({
        next: (res) => {
          this.dados.set(res.data);
          this.erro.set('');
        },
        error: () => this.erro.set('Não foi possível carregar o relatório agora.'),
      });
    });
  }

  ehMaior(valor: number): boolean {
    return valor > 0 && valor === this.maiorSemana();
  }

  baixarPdf(): void {
    window.print();
  }
}

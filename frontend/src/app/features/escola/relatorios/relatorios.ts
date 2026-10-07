import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { Opcoes, Relatorio } from '../../../core/model/painel-escola.model';
import { corDoIndice, mesAtual, nomeMes, percentual } from '../escola-ui';

/** "Escola - Relatorios" do Figma. */
@Component({
  selector: 'app-escola-relatorios',
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.css',
})
export class EscolaRelatorios {
  private service = inject(PainelEscolaService);

  readonly pct = percentual;
  readonly cor = corDoIndice;
  readonly nomeMes = nomeMes;

  /** Ultimos 6 meses para o filtro de periodo. */
  readonly meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  readonly mes = signal(mesAtual());
  readonly turmaId = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('turmaId') ?? '');
  readonly diagnosticoId = signal('');

  readonly opcoes = signal<Opcoes | null>(null);
  readonly relatorio = signal<Relatorio | null>(null);
  readonly erro = signal('');

  /** Variacao entre o primeiro e o ultimo mes com dados da evolucao. */
  readonly variacao = computed(() => {
    const comDados = (this.relatorio()?.evolucao ?? []).filter((e) => e.taxa !== null);
    if (comDados.length < 2) return null;
    const primeiro = comDados[0];
    const ultimo = comDados[comDados.length - 1];
    return { pontos: ultimo.taxa! - primeiro.taxa!, desde: nomeMes(primeiro.mes).split(' ')[0].toLowerCase() };
  });

  constructor() {
    this.service.opcoes().subscribe({ next: (res) => this.opcoes.set(res.data) });
    this.carregar();
  }

  filtrar(campo: 'mes' | 'turmaId' | 'diagnosticoId', valor: string): void {
    this[campo].set(valor);
    this.carregar();
  }

  abreviar(mes: string): string {
    return nomeMes(mes).slice(0, 3);
  }

  exportar(): void {
    window.print();
  }

  private carregar(): void {
    this.erro.set('');
    this.service
      .relatorio({
        mes: this.mes(),
        turmaId: this.turmaId() ? Number(this.turmaId()) : undefined,
        diagnosticoId: this.diagnosticoId() ? Number(this.diagnosticoId()) : undefined,
      })
      .subscribe({
        next: (res) => this.relatorio.set(res.data),
        error: () => this.erro.set('Não foi possível carregar o relatório.'),
      });
  }
}

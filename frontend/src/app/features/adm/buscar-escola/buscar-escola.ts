import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EscolasStore } from '../escolas.store';
import { Escola, PlanoEscola } from '../../../core/model/escola.model';
import {
  ROTULO_PLANO,
  ROTULO_STATUS,
  StatusEscola,
  cidadeUf,
  dataBr,
  iniciais,
  statusEscola,
} from '../escola-ui';

/** Compara sem acento e sem caixa. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** "ADM - Buscar escola" (e o estado "sem resultados") do Figma. */
@Component({
  selector: 'app-buscar-escola',
  imports: [FormsModule, RouterLink],
  templateUrl: './buscar-escola.html',
  styleUrl: './buscar-escola.css',
})
export class BuscarEscola {
  readonly store = inject(EscolasStore);

  readonly iniciais = iniciais;
  readonly status = statusEscola;
  readonly rotuloStatus = ROTULO_STATUS;
  readonly rotuloPlano = ROTULO_PLANO;
  readonly cidadeUf = cidadeUf;
  readonly dataBr = dataBr;

  texto = '';
  cidade = '';
  plano: PlanoEscola | '' = '';
  situacao: StatusEscola | '' = '';

  /** Termo da ultima busca; null enquanto o usuario nao buscou. */
  readonly buscado = signal<string | null>(null);
  readonly resultados = signal<Escola[]>([]);

  readonly cidades = computed(() =>
    [...new Set(this.store.escolas().map((e) => e.cidade).filter((c): c is string => !!c))].sort(),
  );

  buscar(): void {
    const termo = normalizar(this.texto.trim());

    this.resultados.set(
      this.store.escolas().filter(
        (e) =>
          (!termo ||
            [e.nome, e.cidade, e.email].some((campo) => campo && normalizar(campo).includes(termo))) &&
          (!this.cidade || e.cidade === this.cidade) &&
          (!this.plano || e.plano === this.plano) &&
          (!this.situacao || statusEscola(e) === this.situacao),
      ),
    );
    this.buscado.set(this.texto.trim());
  }

  limpar(): void {
    this.texto = '';
    this.cidade = '';
    this.plano = '';
    this.situacao = '';
    this.buscado.set(null);
    this.resultados.set([]);
  }

  detalhe(e: Escola): string {
    if (!e.ativo) {
      return `Plano ${ROTULO_PLANO[e.plano]} - desativada em ${dataBr(e.desativadaEm) || '—'}`;
    }
    return `Plano ${ROTULO_PLANO[e.plano]} - ${e.totalAlunosNee} alunos NEE - ${e.totalProfessores} professores`;
  }
}

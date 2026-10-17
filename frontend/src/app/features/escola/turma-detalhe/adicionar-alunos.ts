import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TurmaDetalhe } from '../../../core/model/painel-escola.model';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { EscolaContexto } from '../escola-contexto';

/** Compara sem acento e sem caixa. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Janela "Adicionar alunos": alunos sem turma ou de outra turma (virada do
 * ano), com o limite de vagas da turma conferido antes de salvar.
 */
@Component({
  selector: 'app-adicionar-alunos',
  imports: [FormsModule],
  templateUrl: './adicionar-alunos.html',
  styleUrl: './adicionar-alunos.css',
})
export class AdicionarAlunos {
  private service = inject(PainelEscolaService);
  private contexto = inject(EscolaContexto);

  turma = input.required<TurmaDetalhe>();
  fechar = output<number>();

  /** 'sem' = alunos sem turma; numero = id da turma de origem. */
  origem: 'sem' | number = 'sem';
  busca = '';
  readonly filtro = signal({ origem: 'sem' as 'sem' | number, busca: '' });
  readonly marcados = signal<Set<number>>(new Set());
  readonly salvando = signal(false);
  readonly erro = signal('');

  /** Outras turmas que tem alunos, para trazer alunos de la. */
  readonly origens = computed(() => {
    const mapa = new Map<number, { id: number; nome: string; total: number }>();
    for (const a of this.contexto.alunos()) {
      if (!a.turma || a.turma.id === this.turma().id) continue;
      const atual = mapa.get(a.turma.id) ?? { id: a.turma.id, nome: a.turma.nome, total: 0 };
      atual.total++;
      mapa.set(a.turma.id, atual);
    }
    return [...mapa.values()].sort((x, y) => x.nome.localeCompare(y.nome));
  });

  readonly semTurma = computed(() => this.contexto.alunos().filter((a) => !a.turma).length);

  readonly lista = computed(() => {
    const { origem, busca } = this.filtro();
    const termo = normalizar(busca.trim());
    return this.contexto
      .alunos()
      .filter((a) => (origem === 'sem' ? !a.turma : a.turma?.id === origem))
      .filter((a) => !termo || normalizar(a.nome).includes(termo) || a.cgm?.includes(termo))
      .sort((x, y) => x.nome.localeCompare(y.nome));
  });

  /** null = turma sem limite. */
  readonly vagas = computed(() => {
    const t = this.turma();
    return t.limiteAlunos ? Math.max(0, t.limiteAlunos - t.totalAlunos) : null;
  });

  readonly passouDoLimite = computed(() => {
    const v = this.vagas();
    return v !== null && this.marcados().size > v;
  });

  readonly todosMarcados = computed(
    () => this.lista().length > 0 && this.lista().every((a) => this.marcados().has(a.id)),
  );

  filtrar(): void {
    this.filtro.set({ origem: this.origem, busca: this.busca });
  }

  trocarOrigem(): void {
    // Marcacoes de outra origem nao fazem sentido na nova lista.
    this.marcados.set(new Set());
    this.filtrar();
  }

  alternar(id: number): void {
    this.marcados.update((s) => {
      const novo = new Set(s);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  alternarTodos(): void {
    const ids = this.lista().map((a) => a.id);
    this.marcados.set(this.todosMarcados() ? new Set() : new Set(ids));
  }

  salvar(): void {
    if (!this.marcados().size || this.passouDoLimite()) return;
    this.salvando.set(true);
    this.erro.set('');
    this.service.matricularAlunos(this.turma().id, [...this.marcados()]).subscribe({
      next: (res) => {
        this.salvando.set(false);
        this.contexto.recarregar();
        this.fechar.emit(res.data.adicionados);
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(e, 'Não foi possível adicionar os alunos agora.'));
      },
    });
  }
}

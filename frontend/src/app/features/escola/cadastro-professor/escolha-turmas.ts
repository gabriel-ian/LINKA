import { Component, input, model } from '@angular/core';

/**
 * Turmas do professor com a disciplina de cada uma: marcar a turma abre as
 * disciplinas do professor para escolher o que ele da ali. Usado no cadastro
 * e na edicao do professor.
 */
@Component({
  selector: 'app-escolha-turmas',
  template: `
    @for (t of turmas(); track t.id) {
      <div class="turma" [class.marcada]="alocacoes().has(t.id)">
        <label class="marcar">
          <input type="checkbox" [checked]="alocacoes().has(t.id)" (change)="alternarTurma(t.id)" />
          {{ t.nome }}
        </label>
        @if (alocacoes().get(t.id); as escolhidas) {
          <div class="chips" role="group" [attr.aria-label]="'Disciplinas em ' + t.nome">
            @for (d of disciplinas(); track d) {
              <button
                type="button"
                class="chip"
                [attr.aria-pressed]="escolhidas.has(d)"
                (click)="alternarDisciplina(t.id, d)"
              >
                {{ d }}
              </button>
            } @empty {
              <span class="ajuda">Escolha as disciplinas do professor acima.</span>
            }
          </div>
        }
      </div>
    } @empty {
      <p class="ajuda">Nenhuma turma cadastrada ainda - o professor pode ser vinculado depois.</p>
    }
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .turma {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px 18px;
      padding: 10px 14px;
      border: 1px solid var(--cor-linha);
      border-radius: 10px;
    }
    .turma.marcada {
      border-color: var(--cor-primaria);
      background: var(--cor-primaria-clara);
    }
    .marcar {
      min-width: 150px;
    }
    .chip {
      padding: 4px 12px;
      font-size: 13px;
    }
    .ajuda {
      margin: 0;
      font-size: 13px;
    }
  `,
})
export class EscolhaTurmas {
  turmas = input.required<{ id: number; nome: string }[]>();
  /** Disciplinas do professor (por nome). */
  disciplinas = input.required<string[]>();
  /** turmaId -> disciplinas escolhidas naquela turma. */
  alocacoes = model.required<Map<number, Set<string>>>();

  alternarTurma(id: number): void {
    const novo = new Map(this.alocacoes());
    // Ao marcar a turma, ja vem com todas as disciplinas do professor.
    if (novo.has(id)) novo.delete(id);
    else novo.set(id, new Set(this.disciplinas()));
    this.alocacoes.set(novo);
  }

  alternarDisciplina(turmaId: number, disciplina: string): void {
    const novo = new Map(this.alocacoes());
    const atual = new Set(novo.get(turmaId));
    if (atual.has(disciplina)) atual.delete(disciplina);
    else atual.add(disciplina);
    novo.set(turmaId, atual);
    this.alocacoes.set(novo);
  }
}

/** Mapa da tela -> formato da API. */
export function paraAlocacoes(mapa: Map<number, Set<string>>) {
  return [...mapa.entries()].map(([turmaId, d]) => ({ turmaId, disciplinas: [...d] }));
}

/** Tira das turmas as disciplinas que o professor deixou de ter. */
export function limparAlocacoes(
  mapa: Map<number, Set<string>>,
  disciplinas: string[],
): Map<number, Set<string>> {
  const validas = new Set(disciplinas);
  return new Map(
    [...mapa.entries()].map(([id, d]) => [id, new Set([...d].filter((x) => validas.has(x)))]),
  );
}

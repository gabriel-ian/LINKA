import { Component, DestroyRef, inject, input, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, switchMap } from 'rxjs';
import { Familia } from '../../../core/model/painel-escola.model';
import { PainelEscolaService } from '../../../core/services/painel-escola.service';

export type ModoFamilia = 'existente' | 'nova' | 'nenhuma';

export const PARENTESCOS = ['Mãe', 'Pai', 'Avó', 'Avô', 'Tia', 'Tio', 'Responsável legal', 'Outro'];

/**
 * Responsavel do aluno: escolher uma familia ja cadastrada (irmaos na
 * escola), cadastrar uma nova ou deixar para depois.
 */
@Component({
  selector: 'app-escolha-familia',
  imports: [FormsModule],
  templateUrl: './escolha-familia.html',
  styleUrl: './escolha-familia.css',
})
export class EscolhaFamilia {
  private service = inject(PainelEscolaService);

  /** No vinculo pelo perfil do aluno nao faz sentido "sem responsavel". */
  permitirNenhuma = input(true);
  erros = input<{ respNome?: string; respEmail?: string; familia?: string }>({});

  modo = model<ModoFamilia>('nenhuma');
  familia = model<Familia | null>(null);
  nome = model('');
  email = model('');
  telefone = model('');
  parentesco = model('');

  readonly parentescos = PARENTESCOS;
  readonly resultados = signal<Familia[]>([]);
  readonly buscando = signal(false);
  busca = '';
  private readonly termos = new Subject<string>();

  constructor() {
    this.termos
      .pipe(
        debounceTime(250),
        switchMap((t) => {
          this.buscando.set(true);
          return this.service.familias(t);
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe({
        next: (res) => {
          this.buscando.set(false);
          this.resultados.set(res.data.slice(0, 8));
        },
        error: () => this.buscando.set(false),
      });
  }

  escolherModo(modo: ModoFamilia): void {
    this.modo.set(modo);
    if (modo === 'existente' && !this.familia()) this.termos.next(this.busca);
  }

  buscar(termo: string): void {
    this.termos.next(termo);
  }

  selecionar(f: Familia): void {
    this.familia.set(f);
  }

  trocar(): void {
    this.familia.set(null);
    this.termos.next(this.busca);
  }

  nomesFilhos(f: Familia): string {
    return f.filhos.map((x) => x.nome.split(' ')[0] + (x.turma ? ` (${x.turma})` : '')).join(', ');
  }
}

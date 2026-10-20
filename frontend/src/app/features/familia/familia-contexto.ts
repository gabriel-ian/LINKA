import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ContextoFamilia, PainelFamilia } from '../../core/model/painel-familia.model';
import { PainelFamiliaService } from '../../core/services/painel-familia.service';

const CHAVE_FILHO = 'linka.familia.filho';

/**
 * Responsavel logado e o filho escolhido no menu "FILHO (A)" (fornecido no
 * FamiliaLayout). O painel do filho alimenta a tela inicial e o sino.
 */
@Injectable()
export class FamiliaContexto {
  private service = inject(PainelFamiliaService);

  readonly dados = signal<ContextoFamilia | null>(null);
  readonly filhoId = signal<number | null>(null);
  readonly painel = signal<PainelFamilia | null>(null);
  readonly erro = signal('');

  readonly filho = computed(
    () => this.dados()?.filhos.find((f) => f.id === this.filhoId()) ?? null,
  );

  constructor() {
    this.service.contexto().subscribe({
      next: (res) => {
        this.dados.set(res.data);
        const salvo = Number(ler());
        const valido = res.data.filhos.find((f) => f.id === salvo) ?? res.data.filhos[0];
        if (valido && this.filhoId() === null) this.filhoId.set(valido.id);
      },
      error: () => this.erro.set('Não foi possível carregar os dados da família.'),
    });

    effect(() => {
      const id = this.filhoId();
      if (id === null) return;
      guardar(id);
      this.recarregarPainel();
    });
  }

  /** A familia aceitou o termo: libera o painel. */
  termoAceito(): void {
    this.dados.update((d) => (d ? { ...d, termo: { ...d.termo, pendente: false } } : d));
  }

  selecionar(filhoId: number): void {
    if (this.dados()?.filhos.some((f) => f.id === filhoId)) this.filhoId.set(filhoId);
  }

  recarregarPainel(): void {
    const id = this.filhoId();
    if (id === null) return;
    this.service.painel(id).subscribe({
      next: (res) => this.painel.set(res.data),
      error: () => this.erro.set('Não foi possível carregar o painel agora.'),
    });
  }
}

function ler(): string | null {
  try {
    return localStorage.getItem(CHAVE_FILHO);
  } catch {
    return null;
  }
}

function guardar(id: number): void {
  try {
    localStorage.setItem(CHAVE_FILHO, String(id));
  } catch {
    // Sem armazenamento: so nao lembra o filho na proxima visita.
  }
}

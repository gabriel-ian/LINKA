import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { ResumoAluno, TarefaResumoAluno } from '../../core/model/painel-aluno.model';
import { AlunoOfflineService } from '../../core/services/aluno-offline.service';
import { ConexaoService } from '../../core/services/conexao.service';
import { PainelAlunoService } from '../../core/services/painel-aluno.service';
import { hojeIso } from './aluno-ui';

/** Sem internet, tenta de novo sozinho a cada 30 segundos. */
const NOVA_TENTATIVA_MS = 30_000;

/**
 * Aluno logado (fornecido no AlunoLayout): resumo com pontos e tarefas,
 * e a fala do mascote na barra, que cada tela troca ao abrir. Sem internet,
 * usa a ultima copia guardada e mostra os passos feitos offline.
 */
@Injectable()
export class AlunoContexto {
  private service = inject(PainelAlunoService);
  private conexao = inject(ConexaoService);
  readonly offline = inject(AlunoOfflineService);

  readonly resumo = signal<ResumoAluno | null>(null);
  readonly erro = signal('');
  readonly fala = signal('');
  readonly tentando = signal(false);
  readonly semConexao = computed(() => !this.conexao.online());

  readonly pendentes = computed(
    () => this.resumo()?.tarefas.filter((t) => t.situacao !== 'concluida') ?? [],
  );

  /** Tarefas que vencem hoje (feitas ou nao) e as atrasadas ainda abertas. */
  readonly deHoje = computed<TarefaResumoAluno[]>(() => {
    const hoje = hojeIso();
    return (this.resumo()?.tarefas ?? []).filter(
      (t) =>
        t.dataEntrega === hoje ||
        (t.situacao !== 'concluida' && !!t.dataEntrega && t.dataEntrega < hoje),
    );
  });

  readonly proximas = computed(() => {
    const hoje = hojeIso();
    return this.pendentes().filter((t) => !t.dataEntrega || t.dataEntrega > hoje);
  });

  constructor() {
    this.offline.iniciar();

    // A internet voltou: envia o que foi feito offline e atualiza tudo.
    let estavaOnline = this.conexao.online();
    effect(() => {
      const online = this.conexao.online();
      if (online && !estavaOnline) void this.sincronizar();
      estavaOnline = online;
    });

    // O navegador nem sempre avisa quando a rede volta (ex.: so o servidor
    // caiu); enquanto estiver offline, tenta de tempos em tempos.
    const timer = setInterval(() => {
      if (this.semConexao()) void this.sincronizar();
    }, NOVA_TENTATIVA_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    void this.sincronizar();
  }

  /** Envia a fila de passos offline e recarrega o resumo. */
  async sincronizar(): Promise<void> {
    this.tentando.set(true);
    await this.offline.enviar();
    this.recarregar();
  }

  recarregar(): void {
    this.service.resumo().subscribe({
      next: (res) => {
        this.conexao.online.set(true);
        this.tentando.set(false);
        this.offline.guardarResumo(res.data);
        this.offline.baixarParaOffline(res.data);
        this.resumo.set(this.offline.aplicarNoResumo(res.data));
        this.erro.set('');
      },
      error: (e: unknown) => {
        this.tentando.set(false);
        const copia = ConexaoService.semRede(e) ? this.offline.lerResumo() : null;
        if (ConexaoService.semRede(e)) this.conexao.online.set(false);
        if (copia) {
          this.resumo.set(this.offline.aplicarNoResumo(copia));
          this.erro.set('');
        } else {
          this.erro.set('Não foi possível carregar suas missões agora.');
        }
      },
    });
  }

  /** Depois de um passo feito offline: atualiza a lista sem ir ao servidor. */
  aplicarPendentes(): void {
    this.resumo.update((r) => (r ? this.offline.aplicarNoResumo(r) : r));
  }
}

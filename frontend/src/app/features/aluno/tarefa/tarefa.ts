import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { TarefaAluno } from '../../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { VozService } from '../../../core/services/voz.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { AlunoContexto } from '../aluno-contexto';
import { hojeIso, horaCurta, plural, tituloCompleto } from '../aluno-ui';

/** Icone do Figma para cada material, pelo nome que a IA escreveu. */
const ICONES_MATERIAL: [RegExp, string][] = [
  [/calculadora/i, 'mat-calculadora'],
  [/r[eé]gua|esquadro|transferidor/i, 'mat-regua'],
  [/caneta|l[aá]pis|borracha|marca/i, 'mat-caneta'],
];

/**
 * "Aluno - Tarefa passo N" do Figma e a versao "modo calmo" (um passo por
 * vez, menos cores). Os passos sao concluidos em ordem.
 */
@Component({
  selector: 'app-aluno-tarefa',
  imports: [RouterLink],
  templateUrl: './tarefa.html',
  styleUrl: './tarefa.css',
})
export class AlunoTarefa {
  private service = inject(PainelAlunoService);
  private router = inject(Router);
  readonly contexto = inject(AlunoContexto);
  readonly voz = inject(VozService);

  readonly tarefa = signal<TarefaAluno | null>(null);
  readonly erro = signal('');
  readonly salvando = signal(false);

  readonly titulo = computed(() => {
    const t = this.tarefa();
    return t ? tituloCompleto(t) : '';
  });

  readonly calmo = computed(() => !!this.contexto.resumo()?.preferencias.modoCalmo);
  readonly feitos = computed(() => this.tarefa()?.passosFeitos ?? 0);
  readonly total = computed(() => this.tarefa()?.totalPassos ?? 0);
  readonly pct = computed(() =>
    this.total() ? Math.round((this.feitos() / this.total()) * 100) : 0,
  );
  /** Indice (0..) do passo atual; igual ao total quando tudo foi feito. */
  readonly atual = computed(() => this.feitos());

  readonly prazo = computed(() => {
    const t = this.tarefa();
    if (!t?.dataEntrega) return 'Sem prazo';
    const hora = t.horaLimite ? ` às ${horaCurta(t.horaLimite)}` : '';
    if (t.dataEntrega === hojeIso()) return `Vence hoje${hora}`;
    if (t.dataEntrega < hojeIso()) return 'Atrasada';
    const [, m, d] = t.dataEntrega.split('-');
    return `Entrega em ${d}/${m}${hora}`;
  });

  readonly situacao = computed(() => {
    const t = this.tarefa();
    if (!t) return { texto: '', cor: '' };
    if (t.situacao === 'concluida') return { texto: 'Concluída', cor: 'verde' };
    return this.feitos() > 0
      ? { texto: 'Em andamento', cor: 'laranja' }
      : { texto: 'Não iniciada', cor: 'cinza' };
  });

  constructor() {
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed(inject(DestroyRef)))
      .subscribe((p) => this.carregar(Number(p.get('id'))));

    effect(() => {
      this.contexto.fala.set(
        this.calmo()
          ? 'Modo calmo ligado. Um passo de cada vez.'
          : 'Vamos com calma! Leia um passo de cada vez. Sem pressa - você consegue!',
      );
    });
  }

  private carregar(id: number): void {
    this.tarefa.set(null);
    this.service.tarefa(id).subscribe({
      next: (res) => this.tarefa.set(res.data),
      error: (e: HttpErrorResponse) =>
        this.erro.set(
          e.status === 404
            ? 'Tarefa não encontrada.'
            : 'Não foi possível abrir a tarefa agora. Tente de novo.',
        ),
    });
  }

  iconeMaterial(nome: string): string {
    const achado = ICONES_MATERIAL.find(([re]) => re.test(nome));
    return `assets/aluno/${achado?.[1] ?? 'mat-caderno'}.svg`;
  }

  textoPassos(n: number): string {
    return plural(n, 'passo', 'passos');
  }

  ouvirObjetivo(): void {
    const t = this.tarefa();
    if (t) this.voz.falar(`Objetivo da tarefa: ${t.objetivo}`);
  }

  ouvirMateriais(): void {
    const t = this.tarefa();
    if (t?.materiais.length) this.voz.falar(`Você vai precisar de: ${t.materiais.join(', ')}.`);
  }

  ouvirPasso(i: number): void {
    const t = this.tarefa();
    if (t) this.voz.falar(`Passo ${i + 1}. ${t.passos[i]}`);
  }

  concluirPasso(): void {
    const t = this.tarefa();
    if (!t || this.salvando()) return;
    const passo = this.feitos() + 1;

    this.salvando.set(true);
    this.erro.set('');
    this.service.concluirPasso(t.id, passo).subscribe({
      next: (res) => {
        this.salvando.set(false);
        this.contexto.recarregar();
        if (res.data.concluida) {
          this.voz.parar();
          this.router.navigate(['/aluno/tarefas', t.id, 'concluida'], {
            state: { resultado: res.data, titulo: this.titulo() },
          });
          return;
        }
        this.tarefa.set({ ...t, passosFeitos: res.data.passosFeitos, situacao: 'em-andamento' });
        if (this.contexto.resumo()?.preferencias.ouvirVoz) this.ouvirPasso(res.data.passosFeitos);
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(e, 'Não foi possível salvar o passo. Tente de novo.'));
        if (e.status === 400) this.carregar(t.id);
      },
    });
  }

  voltarAoNormal(): void {
    this.service.salvarPreferencias({ modoCalmo: false }).subscribe({
      next: (res) => this.contexto.resumo.set(res.data),
    });
  }
}

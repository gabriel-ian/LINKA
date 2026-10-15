import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { PainelFamiliaService } from '../../../core/services/painel-familia.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { hojeIso, horaCurta, prazo, tituloCompleto } from '../../aluno/aluno-ui';
import { FamiliaContexto } from '../familia-contexto';

/** "Familia - Enviar incentivo" e "Familia - Incentivo enviado" do Figma. */
@Component({
  selector: 'app-familia-incentivo',
  imports: [RouterLink],
  templateUrl: './incentivo.html',
  styleUrls: ['../familia-comum.css', './incentivo.css'],
})
export class FamiliaIncentivo {
  readonly contexto = inject(FamiliaContexto);
  private service = inject(PainelFamiliaService);

  private readonly tarefaId = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(map((q) => Number(q.get('tarefa')) || null)),
    { initialValue: null },
  );

  /** A tarefa do link, se for mesmo do filho escolhido. */
  readonly tarefa = computed(() => {
    const id = this.tarefaId();
    return this.contexto.painel()?.tarefas.find((t) => t.id === id) ?? null;
  });

  readonly sugestoes = computed(() => {
    const p = this.contexto.painel();
    const t = this.tarefa();
    const dias = p?.sequencia.atual ?? 0;
    return [
      'Você consegue! Que tal começar só pelo primeiro passo?',
      dias >= 2
        ? `Tenho muito orgulho da sua sequência de ${dias} dias. Bora manter?`
        : 'Tenho muito orgulho do seu esforço. Bora fazer mais uma?',
      t?.disciplina
        ? `Quando terminar a ${t.disciplina}, a gente comemora junto!`
        : 'Quando terminar a tarefa, a gente comemora junto!',
    ];
  });

  /** Faixa laranja: "Exercicios 5 a 10 - Matematica - prazo hoje as 18h - ainda nao iniciada". */
  readonly faixa = computed(() => {
    const t = this.tarefa();
    if (!t) return '';
    const quando =
      t.dataEntrega === hojeIso()
        ? `prazo hoje${t.horaLimite ? ' às ' + horaCurta(t.horaLimite) : ''}`
        : prazo(t).texto.toLowerCase();
    const andamento =
      t.situacao === 'em-andamento'
        ? `${t.passosFeitos} de ${t.totalPassos} passos feitos`
        : 'ainda não iniciada';
    return `${tituloCompleto(t)} - ${quando} - ${andamento}`;
  });

  readonly escolhida = signal(0);
  readonly propria = signal('');
  readonly voz = signal(true);
  readonly enviando = signal(false);
  readonly erro = signal('');
  /** Mensagem que foi enviada (mostra a tela de confirmacao). */
  readonly enviada = signal<{ mensagem: string; voz: boolean } | null>(null);

  readonly mensagem = computed(() =>
    this.propria().trim() ? this.propria().trim() : (this.sugestoes()[this.escolhida()] ?? ''),
  );

  escrever(texto: string): void {
    this.propria.set(texto);
  }

  escolher(i: number): void {
    this.escolhida.set(i);
    this.propria.set('');
  }

  enviar(): void {
    const filhoId = this.contexto.filhoId();
    const mensagem = this.mensagem();
    if (filhoId === null || !mensagem || this.enviando()) return;
    this.enviando.set(true);
    this.erro.set('');
    this.service
      .enviarIncentivo(filhoId, {
        mensagem,
        voz: this.voz(),
        ...(this.tarefa() ? { tarefaId: this.tarefa()!.id } : {}),
      })
      .subscribe({
        next: (res) => {
          this.enviando.set(false);
          this.enviada.set({ mensagem: res.data.mensagem, voz: res.data.voz });
          this.contexto.recarregarPainel();
        },
        error: (e) => {
          this.enviando.set(false);
          this.erro.set(mensagemDeErro(e, 'Não foi possível enviar o incentivo agora.'));
        },
      });
  }
}

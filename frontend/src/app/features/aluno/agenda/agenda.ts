import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AgendaAluno, Lembrete, TarefaResumoAluno } from '../../../core/model/painel-aluno.model';
import { PainelAlunoService } from '../../../core/services/painel-aluno.service';
import { mensagemDeErro } from '../../../core/util/mensagem-erro';
import { HttpErrorResponse } from '@angular/common/http';
import { AlunoContexto } from '../aluno-contexto';
import { dataDe, hojeIso, horaCurta, intervaloSemana, isoDe, plural } from '../aluno-ui';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const CORES_LEMBRETE = ['laranja', 'roxo', 'vermelho', 'azul'];

/**
 * "Aluno - Agenda" do Figma: semana de segunda a sexta e lembretes. Sabado e
 * domingo aparecem quando tem tarefa neles ou quando e hoje.
 */
@Component({
  selector: 'app-aluno-agenda',
  imports: [FormsModule, RouterLink],
  templateUrl: './agenda.html',
  styleUrl: './agenda.css',
})
export class AlunoAgenda {
  private service = inject(PainelAlunoService);
  private contexto = inject(AlunoContexto);

  readonly agenda = signal<AgendaAluno | null>(null);
  readonly erro = signal('');
  readonly hoje = hojeIso();
  readonly intervalo = intervaloSemana;
  readonly hora = horaCurta;

  readonly criando = signal(false);
  readonly salvando = signal(false);
  readonly erroLembrete = signal('');
  texto = '';
  quando = '';

  constructor() {
    this.carregar();
  }

  carregar(semana?: string): void {
    this.service.agenda(semana).subscribe({
      next: (res) => {
        this.agenda.set(res.data);
        this.falar(res.data);
      },
      error: () => this.erro.set('Não foi possível carregar a agenda agora.'),
    });
  }

  private falar(a: AgendaAluno): void {
    const abertas = (dia: string) =>
      a.dias.find((d) => d.data === dia)?.tarefas.filter((t) => t.situacao !== 'concluida')
        .length ?? 0;
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const h = abertas(this.hoje);
    const m = abertas(isoDe(amanha));
    this.contexto.fala.set(
      h || m
        ? `Hoje você tem ${plural(h, 'missão', 'missões')}. Amanhã, ${m ? plural(m, 'missão', 'missões') : 'nenhuma'}!`
        : 'Sua semana está tranquila. Que tal criar um lembrete?',
    );
  }

  mudarSemana(dias: number): void {
    const a = this.agenda();
    if (!a) return;
    const d = dataDe(a.inicio);
    d.setDate(d.getDate() + dias);
    this.carregar(isoDe(d));
  }

  cor(t: TarefaResumoAluno, i: number): string {
    if (t.situacao === 'concluida') return 'verde';
    if (t.dataEntrega && t.dataEntrega < this.hoje) return 'vermelho';
    if (t.dataEntrega === this.hoje) return 'laranja';
    return i % 2 ? 'roxo' : 'azul';
  }

  detalhe(t: TarefaResumoAluno): string {
    const materia = t.disciplina ?? 'Tarefa';
    if (t.situacao === 'concluida') return `${materia} - feito`;
    return t.horaLimite ? `${materia} - até ${horaCurta(t.horaLimite)}` : materia;
  }

  quandoLembrete(l: Lembrete): string {
    const d = new Date(l.quando);
    const dia = isoDe(d);
    const amanha = new Date();
    amanha.setDate(amanha.getDate() + 1);
    const nome = dia === this.hoje ? 'Hoje' : dia === isoDe(amanha) ? 'Amanhã' : DIAS[d.getDay()];
    const p = (n: number) => String(n).padStart(2, '0');
    return `${nome}, ${horaCurta(`${p(d.getHours())}:${p(d.getMinutes())}`)}`;
  }

  corLembrete(i: number): string {
    return CORES_LEMBRETE[i % CORES_LEMBRETE.length];
  }

  abrirNovo(): void {
    const daqui = new Date(Date.now() + 60 * 60_000);
    const p = (n: number) => String(n).padStart(2, '0');
    this.quando = `${isoDe(daqui)}T${p(daqui.getHours())}:00`;
    this.texto = '';
    this.erroLembrete.set('');
    this.criando.set(true);
  }

  salvar(): void {
    if (!this.texto.trim()) {
      this.erroLembrete.set('Escreva o que você quer lembrar.');
      return;
    }
    if (!this.quando) {
      this.erroLembrete.set('Escolha o dia e a hora.');
      return;
    }
    this.salvando.set(true);
    this.service.criarLembrete(this.texto.trim(), new Date(this.quando).toISOString()).subscribe({
      next: () => {
        this.salvando.set(false);
        this.criando.set(false);
        this.carregar(this.agenda()?.inicio);
      },
      error: (e: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erroLembrete.set(mensagemDeErro(e, 'Não foi possível salvar o lembrete.'));
      },
    });
  }

  remover(l: Lembrete): void {
    this.service.removerLembrete(l.id).subscribe({
      next: () =>
        this.agenda.update((a) =>
          a ? { ...a, lembretes: a.lembretes.filter((x) => x.id !== l.id) } : a,
        ),
    });
  }
}

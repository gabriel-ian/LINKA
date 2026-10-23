import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { EmailService } from '../email/email.service';
import {
  mensagemComunicado,
  mensagemLembreteTarefa,
  mensagemTarefaConcluida,
} from '../email/modelos';
import { iso } from '../painel-escola/metricas';
import {
  PreferenciasFamilia,
  faixaDoHorario,
  preferenciasDe,
} from '../painel-familia/preferencias';

interface Familia {
  id: number;
  nome: string | null;
  email: string;
  preferencias: unknown;
}

type Aviso = keyof Omit<PreferenciasFamilia, 'horario'>;

/** Quanto antes do prazo sai o lembrete de tarefa nao iniciada. */
const ANTECEDENCIA_MIN = 3 * 60;

/** "HH:MM[:SS]" -> minutos do dia. */
function minutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Lembrete de tarefa nao iniciada: com hora limite, nas 3h antes dela; sem
 * hora, dentro do "horario preferido para lembretes" da familia.
 */
export function horaDeAvisar(
  horaLimite: string | null,
  horario: string,
  agora: Date,
): boolean {
  const agoraMin = agora.getHours() * 60 + agora.getMinutes();
  if (horaLimite) {
    const limite = minutos(horaLimite);
    return agoraMin >= limite - ANTECEDENCIA_MIN && agoraMin < limite;
  }
  const [inicio, fim] = faixaDoHorario(horario);
  return agoraMin >= inicio * 60 && agoraMin < fim * 60;
}

/** '18:00:00' -> 'hoje às 18h'; '18:30' -> 'hoje às 18h30'. */
export function textoPrazo(horaLimite: string | null): string {
  if (!horaLimite) return 'hoje';
  const [h, m] = horaLimite.split(':');
  return `hoje às ${Number(h)}h${m && m !== '00' ? m : ''}`;
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

/**
 * Avisos por e-mail que a familia liga em Configuracoes: tarefa concluida,
 * avisos da escola e tarefa com prazo hoje nao iniciada. Os dois primeiros
 * saem na hora do evento; o lembrete e conferido a cada 15 minutos.
 */
@Injectable()
export class AvisosFamiliaService {
  private readonly logger = new Logger(AvisosFamiliaService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly email: EmailService,
  ) {}

  /** O filho concluiu a tarefa (inclusive a que foi feita offline). */
  tarefaConcluida(alunoId: number, tarefaId: number): void {
    void this.enviarConcluida(alunoId, tarefaId).catch((e: unknown) =>
      this.falhou('tarefa concluida', e),
    );
  }

  /** O professor enviou um comunicado para a turma. */
  comunicado(comunicadoId: number): void {
    void this.enviarComunicado(comunicadoId).catch((e: unknown) =>
      this.falhou('comunicado', e),
    );
  }

  @Cron('*/15 * * * *', { timeZone: 'America/Sao_Paulo' })
  async lembretesTarefaNaoIniciada(agora = new Date()): Promise<number> {
    // Sem SMTP nao manda nada (e nao enche o terminal a cada 15 minutos).
    if (!this.email.disponivel) return 0;

    const linhas: (Familia & {
      alunoId: number;
      tarefaId: number;
      titulo: string;
      horaLimite: string | null;
      filho: string;
    })[] = await this.dataSource.query(
      `SELECT ts.aluno_id alunoId, t.id tarefaId, t.titulo, t.hora_limite horaLimite,
              a.nome_completo filho, r.id, r.nome_completo nome, u.email, r.preferencias
         FROM tarefa_status ts
         JOIN tarefa t ON t.id = ts.tarefa_id
         JOIN aluno a ON a.id = ts.aluno_id AND a.ativo = 1
         JOIN escola e ON e.id = a.escola_id AND e.ativo = 1
         JOIN aluno_responsavel ar ON ar.aluno_id = a.id
         JOIN responsavel r ON r.id = ar.responsavel_id
         JOIN usuario u ON u.id = r.usuario_id AND u.ativo = 1
        WHERE t.data_entrega = ? AND ts.status <> 'concluida' AND ts.passos_feitos = 0`,
      [iso(agora)],
    );

    let enviados = 0;
    for (const l of linhas) {
      const prefs = preferenciasDe(l.preferencias);
      if (!prefs.tarefaNaoIniciada) continue;
      if (!horaDeAvisar(l.horaLimite, prefs.horario, agora)) continue;

      // Uma vez por dia por familia, filho e tarefa.
      const marcado: { affectedRows: number } = await this.dataSource.query(
        `INSERT IGNORE INTO notificacao_enviada (responsavel_id, tipo, aluno_id, tarefa_id, dia)
         VALUES (?, 'tarefa-nao-iniciada', ?, ?, ?)`,
        [l.id, l.alunoId, l.tarefaId, iso(agora)],
      );
      if (!marcado.affectedRows) continue;

      const ok = await this.email.enviar(
        l.email,
        mensagemLembreteTarefa({
          nome: l.nome,
          filho: primeiroNome(l.filho),
          tarefa: l.titulo,
          prazo: textoPrazo(l.horaLimite),
          urlPainel: this.email.url('/familia'),
        }),
      );
      if (ok) enviados++;
    }
    if (enviados)
      this.logger.log(`Lembretes de tarefa nao iniciada: ${enviados}`);
    return enviados;
  }

  // ---------------------------------------------------------------------

  private async enviarConcluida(alunoId: number, tarefaId: number) {
    const [info]: { filho: string; tarefa: string }[] =
      await this.dataSource.query(
        `SELECT a.nome_completo filho, t.titulo tarefa
           FROM aluno a JOIN tarefa t ON t.id = ?
          WHERE a.id = ?`,
        [tarefaId, alunoId],
      );
    if (!info) return;

    const familias = await this.familias('tarefaConcluida', 'ar.aluno_id = ?', [
      alunoId,
    ]);
    for (const f of familias) {
      await this.email.enviar(
        f.email,
        mensagemTarefaConcluida({
          nome: f.nome,
          filho: primeiroNome(info.filho),
          tarefa: info.tarefa,
          urlPainel: this.email.url('/familia/incentivo'),
        }),
      );
    }
  }

  private async enviarComunicado(comunicadoId: number) {
    const [c]: {
      titulo: string;
      mensagem: string;
      turma: string;
      turmaId: number;
    }[] = await this.dataSource.query(
      `SELECT c.titulo, c.mensagem, t.nome turma, c.turma_id turmaId
         FROM comunicado c JOIN turma t ON t.id = c.turma_id
        WHERE c.id = ? AND c.rascunho = 0`,
      [comunicadoId],
    );
    if (!c) return;

    const familias = await this.familias(
      'avisosEscola',
      `ar.aluno_id IN (SELECT m.aluno_id FROM matricula m
                         JOIN aluno a ON a.id = m.aluno_id AND a.ativo = 1
                        WHERE m.turma_id = ?)`,
      [c.turmaId],
    );
    for (const f of familias) {
      await this.email.enviar(
        f.email,
        mensagemComunicado({
          nome: f.nome,
          turma: c.turma,
          titulo: c.titulo,
          mensagem: c.mensagem,
          urlAvisos: this.email.url('/familia/avisos'),
        }),
      );
    }
  }

  /**
   * Familias com login ativo dos alunos que passam no filtro (sobre
   * aluno_responsavel `ar`), so as que ligaram o aviso informado.
   */
  private async familias(
    aviso: Aviso,
    filtro: string,
    params: unknown[],
  ): Promise<Familia[]> {
    const linhas: Familia[] = await this.dataSource.query(
      `SELECT DISTINCT r.id, r.nome_completo nome, u.email, r.preferencias
         FROM aluno_responsavel ar
         JOIN responsavel r ON r.id = ar.responsavel_id
         JOIN usuario u ON u.id = r.usuario_id AND u.ativo = 1
        WHERE ${filtro}`,
      params,
    );
    return linhas.filter((f) => preferenciasDe(f.preferencias)[aviso]);
  }

  private falhou(qual: string, erro: unknown): void {
    this.logger.error(
      `Aviso de ${qual} nao enviado: ${erro instanceof Error ? erro.message : String(erro)}`,
    );
  }
}

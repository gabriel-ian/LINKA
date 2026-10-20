import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { promises as fs } from 'fs';
import { join } from 'path';
import { EmailService } from '../email/email.service';
import { mensagemPedidoExclusao } from '../email/modelos';
import { PASTA_LAUDOS } from '../painel-escola/cadastros-escola.service';

/**
 * Versao do termo de uso e privacidade que a familia aceita. Mudou o texto
 * (frontend/src/app/features/privacidade), sobe a versao: todas as familias
 * aceitam de novo no proximo acesso.
 */
export const TERMO_VERSAO = '2026-10';

export type AcaoLaudo = 'envio' | 'download';

/**
 * LGPD: aceite do termo pela familia, copia dos dados do aluno (direito de
 * acesso), pedido e execucao da exclusao (anonimizacao) e registro de quem
 * enviou ou baixou cada laudo.
 */
@Injectable()
export class LgpdService {
  private readonly logger = new Logger(LgpdService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly email: EmailService,
  ) {}

  // ---------------------------------------------------------------- termo

  /** A familia ainda nao aceitou a versao atual do termo. */
  async termoPendente(responsavelId: number): Promise<boolean> {
    const [aceite]: unknown[] = await this.dataSource.query(
      'SELECT 1 FROM consentimento WHERE responsavel_id = ? AND versao = ? LIMIT 1',
      [responsavelId, TERMO_VERSAO],
    );
    return !aceite;
  }

  async aceitarTermo(usuarioId: number, versao: string, ip: string | null) {
    if (versao !== TERMO_VERSAO) {
      throw new BadRequestException(
        'O termo mudou. Recarregue a pagina e leia a versao nova.',
      );
    }
    const responsavelId = await this.responsavelDoUsuario(usuarioId);
    if (await this.termoPendente(responsavelId)) {
      await this.dataSource.query(
        'INSERT INTO consentimento (responsavel_id, versao, ip) VALUES (?, ?, ?)',
        [responsavelId, TERMO_VERSAO, ip?.slice(0, 45) ?? null],
      );
    }
    return { data: { versao: TERMO_VERSAO, aceito: true } };
  }

  // ------------------------------------------------------- acesso / copia

  /** Copia dos dados do filho, para a propria familia. */
  async dadosParaFamilia(usuarioId: number, alunoId: number) {
    await this.garantirFilho(usuarioId, alunoId);
    return { data: await this.dadosDoAluno(alunoId) };
  }

  /** Copia dos dados do aluno, para a escola dele. */
  async dadosParaEscola(alunoId: number, escolaId: number) {
    await this.garantirAlunoDaEscola(alunoId, escolaId);
    return { data: await this.dadosDoAluno(alunoId) };
  }

  /**
   * Tudo o que a Linka guarda sobre o aluno, em JSON. O laudo vai so como
   * referencia (o arquivo e baixado a parte, pela escola).
   */
  private async dadosDoAluno(alunoId: number) {
    const q = <T>(sql: string) => this.dataSource.query<T[]>(sql, [alunoId]);
    const [aluno] = await q<Record<string, unknown>>(
      `SELECT a.id, a.nome_completo nome, a.data_nascimento dataNascimento, a.cgm,
              e.nome escola, u.email emailDeLogin, a.neurodivergente,
              a.laudo IS NOT NULL temLaudo, a.laudo_enviado_em laudoEnviadoEm,
              a.dificuldades, a.pontos_fortes pontosFortes, a.interesses,
              a.preferencias, a.ativo, a.criado_em cadastradoEm
         FROM aluno a
         JOIN escola e ON e.id = a.escola_id
         LEFT JOIN usuario u ON u.id = a.usuario_id
        WHERE a.id = ?`,
    );
    return {
      geradoEm: new Date().toISOString(),
      aluno,
      diagnosticos: (
        await q<{ nome: string }>(
          `SELECT n.nome FROM aluno_neurodivergencia an
             JOIN neurodivergencia n ON n.id = an.neurodivergencia_id
            WHERE an.aluno_id = ?`,
        )
      ).map((d) => d.nome),
      turma:
        (
          await q<{ turma: string; anoLetivo: number }>(
            `SELECT t.nome turma, t.ano_letivo anoLetivo FROM matricula m
             JOIN turma t ON t.id = m.turma_id WHERE m.aluno_id = ?`,
          )
        )[0] ?? null,
      responsaveis: await q(
        `SELECT r.nome_completo nome, r.parentesco, r.telefone, u.email
           FROM aluno_responsavel ar
           JOIN responsavel r ON r.id = ar.responsavel_id
           LEFT JOIN usuario u ON u.id = r.usuario_id
          WHERE ar.aluno_id = ?`,
      ),
      tarefas: await q(
        `SELECT t.titulo, t.data_entrega dataEntrega, ts.status,
                ts.passos_feitos passosFeitos, ts.iniciado_em iniciadoEm,
                ts.concluido_em concluidoEm, ts.iniciou_sozinho iniciouSozinho
           FROM tarefa_status ts JOIN tarefa t ON t.id = ts.tarefa_id
          WHERE ts.aluno_id = ? ORDER BY t.data_entrega`,
      ),
      tarefasAdaptadas: await q(
        `SELECT t.titulo, ta.criado_em criadoEm FROM tarefa_adaptada ta
           JOIN tarefa t ON t.id = ta.tarefa_id WHERE ta.aluno_id = ?`,
      ),
      incentivosDaFamilia: await q(
        'SELECT mensagem, criado_em criadoEm, lido_em lidoEm FROM incentivo WHERE aluno_id = ?',
      ),
      pedidosDeAjuda: await q(
        'SELECT passo, criado_em criadoEm FROM pedido_ajuda WHERE aluno_id = ?',
      ),
      lembretes: await q(
        'SELECT texto, quando FROM aluno_lembrete WHERE aluno_id = ?',
      ),
      acessosAoLaudo: await q(
        `SELECT la.acao, la.criado_em criadoEm, u.email quem FROM laudo_acesso la
           LEFT JOIN usuario u ON u.id = la.usuario_id
          WHERE la.aluno_id = ? ORDER BY la.criado_em`,
      ),
    };
  }

  // -------------------------------------------------------------- exclusao

  /** A familia pede a exclusao dos dados do filho; a escola e avisada. */
  async pedirExclusao(usuarioId: number, alunoId: number) {
    const responsavelId = await this.garantirFilho(usuarioId, alunoId);
    const [aberto]: unknown[] = await this.dataSource.query(
      `SELECT 1 FROM lgpd_pedido
        WHERE aluno_id = ? AND tipo = 'exclusao' AND atendido_em IS NULL LIMIT 1`,
      [alunoId],
    );
    if (!aberto) {
      await this.dataSource.query(
        "INSERT INTO lgpd_pedido (aluno_id, responsavel_id, tipo) VALUES (?, ?, 'exclusao')",
        [alunoId, responsavelId],
      );
      void this.avisarEscola(alunoId).catch((e: unknown) =>
        this.logger.error(`Aviso de pedido de exclusao: ${String(e)}`),
      );
    }
    return { data: { pedido: true } };
  }

  /** Para o perfil do aluno na escola: pedido aberto e historico do laudo. */
  async situacao(alunoId: number, escolaId: number) {
    await this.garantirAlunoDaEscola(alunoId, escolaId);
    const [pedido]: { criadoEm: Date; quem: string | null }[] =
      await this.dataSource.query(
        `SELECT p.criado_em criadoEm, r.nome_completo quem FROM lgpd_pedido p
           LEFT JOIN responsavel r ON r.id = p.responsavel_id
          WHERE p.aluno_id = ? AND p.tipo = 'exclusao' AND p.atendido_em IS NULL
          ORDER BY p.criado_em LIMIT 1`,
        [alunoId],
      );
    const laudo: { acao: AcaoLaudo; criadoEm: Date; quem: string | null }[] =
      await this.dataSource.query(
        `SELECT la.acao, la.criado_em criadoEm, u.email quem FROM laudo_acesso la
           LEFT JOIN usuario u ON u.id = la.usuario_id
          WHERE la.aluno_id = ? ORDER BY la.criado_em DESC LIMIT 50`,
        [alunoId],
      );
    return { data: { pedidoExclusao: pedido ?? null, acessosAoLaudo: laudo } };
  }

  /**
   * Apaga os dados pessoais e de saude do aluno. Fica so um registro anonimo
   * ("Aluno removido") com o andamento das tarefas, para os numeros da turma
   * e da escola nao mudarem. Nao da para desfazer.
   */
  async anonimizar(alunoId: number, escolaId: number, confirmacao: string) {
    const aluno = await this.garantirAlunoDaEscola(alunoId, escolaId);
    if (aluno.anonimizadoEm) {
      throw new BadRequestException('Os dados deste aluno ja foram apagados');
    }
    if (confirmacao.trim().toLowerCase() !== aluno.nome.trim().toLowerCase()) {
      throw new BadRequestException(
        'Digite o nome completo do aluno para confirmar',
      );
    }

    await this.dataSource.transaction(async (m) => {
      for (const tabela of [
        'aluno_neurodivergencia',
        'aluno_responsavel',
        'aluno_lembrete',
        'incentivo',
        'pedido_ajuda',
        'tarefa_adaptada',
        'matricula',
      ]) {
        await m.query(`DELETE FROM ${tabela} WHERE aluno_id = ?`, [alunoId]);
      }
      await m.query(
        `UPDATE aluno
            SET nome_completo = ?, data_nascimento = NULL, cgm = NULL,
                usuario_id = NULL, neurodivergente = 0, laudo = NULL,
                laudo_enviado_em = NULL, dificuldades = NULL,
                pontos_fortes = NULL, interesses = NULL, preferencias = NULL,
                ativo = 0, anonimizado_em = NOW()
          WHERE id = ?`,
        [`Aluno removido #${alunoId}`, alunoId],
      );
      if (aluno.usuarioId) {
        await m.query('DELETE FROM usuario WHERE id = ?', [aluno.usuarioId]);
      }
      await m.query(
        `UPDATE lgpd_pedido SET atendido_em = NOW()
          WHERE aluno_id = ? AND atendido_em IS NULL`,
        [alunoId],
      );
    });

    // O arquivo do laudo sai do disco depois que o banco ja nao aponta para ele.
    if (aluno.laudo) {
      await fs.rm(join(PASTA_LAUDOS, aluno.laudo), { force: true });
    }
    return { data: { anonimizado: true } };
  }

  // ----------------------------------------------------------------- laudo

  registrarLaudo(alunoId: number, usuarioId: number | null, acao: AcaoLaudo) {
    void this.dataSource
      .query(
        'INSERT INTO laudo_acesso (aluno_id, usuario_id, acao) VALUES (?, ?, ?)',
        [alunoId, usuarioId, acao],
      )
      .catch((e: unknown) =>
        this.logger.error(`Registro de laudo nao gravado: ${String(e)}`),
      );
  }

  // ------------------------------------------------------------ internos

  private async responsavelDoUsuario(usuarioId: number): Promise<number> {
    const [r]: { id: number }[] = await this.dataSource.query(
      'SELECT id FROM responsavel WHERE usuario_id = ? LIMIT 1',
      [usuarioId],
    );
    if (!r) throw new NotFoundException('Responsavel nao encontrado');
    return Number(r.id);
  }

  /** O aluno e filho do responsavel logado; devolve o id do responsavel. */
  private async garantirFilho(usuarioId: number, alunoId: number) {
    const responsavelId = await this.responsavelDoUsuario(usuarioId);
    const [vinculo]: unknown[] = await this.dataSource.query(
      `SELECT 1 FROM aluno_responsavel ar JOIN aluno a ON a.id = ar.aluno_id
        WHERE ar.responsavel_id = ? AND ar.aluno_id = ? AND a.anonimizado_em IS NULL`,
      [responsavelId, alunoId],
    );
    if (!vinculo) throw new NotFoundException('Aluno nao encontrado');
    return responsavelId;
  }

  private async garantirAlunoDaEscola(alunoId: number, escolaId: number) {
    const [a]: {
      nome: string;
      usuarioId: number | null;
      laudo: string | null;
      anonimizadoEm: Date | null;
    }[] = await this.dataSource.query(
      `SELECT nome_completo nome, usuario_id usuarioId, laudo, anonimizado_em anonimizadoEm
         FROM aluno WHERE id = ? AND escola_id = ?`,
      [alunoId, escolaId],
    );
    if (!a) throw new NotFoundException('Aluno nao encontrado');
    return a;
  }

  private async avisarEscola(alunoId: number) {
    const [linha]: { aluno: string; escola: string; email: string }[] =
      await this.dataSource.query(
        `SELECT a.nome_completo aluno, e.nome escola, u.email
           FROM aluno a
           JOIN escola e ON e.id = a.escola_id
           JOIN usuario u ON u.escola_id = e.id AND u.perfil = 'escola' AND u.ativo = 1
          WHERE a.id = ? ORDER BY u.id LIMIT 1`,
        [alunoId],
      );
    if (!linha) return;
    await this.email.enviar(
      linha.email,
      mensagemPedidoExclusao({
        escola: linha.escola,
        aluno: linha.aluno,
        url: this.email.url(`/escola/alunos/${alunoId}`),
      }),
    );
  }
}

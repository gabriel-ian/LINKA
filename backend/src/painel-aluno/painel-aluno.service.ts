import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, IsNull, MoreThan } from 'typeorm';
import { Incentivo } from '../painel-familia/incentivo.entity';
import {
  Aluno,
  PREFERENCIAS_PADRAO,
  PreferenciasAluno,
} from '../aluno/aluno.entity';
import { TarefaStatusEntity } from '../tarefa-status/tarefa-status.entity';
import { TarefaAdaptada } from '../tarefa-adaptada/tarefa-adaptada.entity';
import { AvisosFamiliaService } from '../avisos-familia/avisos-familia.service';
import { AdaptacaoIaService } from '../painel-professor/adaptacao-ia.service';
import { perfilParaColunas } from '../painel-escola/cadastros-escola.service';
import { htmlParaTexto, limparHtml, temTexto } from '../comum/html';
import {
  LinhaTarefa,
  iso,
  maiorSequencia,
  mesAtual,
  mesDe,
  noIntervalo,
  paraIso,
  semanaDe,
  taxaConclusao,
} from '../painel-escola/metricas';
import { AlunoLembrete } from './aluno-lembrete.entity';
import { PedidoAjuda } from './pedido-ajuda.entity';
import {
  TarefaJogo,
  conquistaQuaseLa,
  conquistas,
  nivel,
  pontos,
  pontosDaTarefa,
  sequenciaAtual,
} from './gamificacao';
import { AjudaDto, LembreteDto, PreferenciasDto } from './dto/painel-aluno.dto';

export type SituacaoTarefa = 'pendente' | 'em-andamento' | 'concluida';

/** Tarefa do aluno com a versao dele (adaptada ou o enunciado original). */
export interface TarefaDoAluno extends TarefaJogo {
  id: number;
  turmaId: number;
  titulo: string;
  descricao: string | null;
  dataEntrega: string | null;
  horaLimite: string | null;
  professor: string | null;
  passos: string[];
  materiais: string[];
  passosFeitos: number;
  /** Resposta entregue pelo aluno (HTML limpo) e quando. */
  resposta: string | null;
  respostaEm: Date | null;
}

/** Linha da consulta de tarefas do aluno, como o mysql2 devolve. */
interface LinhaBanco {
  id: number;
  turmaId: number;
  titulo: string;
  descricao: string | null;
  dataEntrega: Date | string | null;
  horaLimite: string | null;
  disciplina: string | null;
  professor: string | null;
  status: string;
  concluidoEm: Date | null;
  iniciadoEm: Date | null;
  iniciouSozinho: number | null;
  passosFeitos: number;
  resposta: string | null;
  respostaEm: Date | null;
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
/** Pedidos repetidos dentro deste intervalo nao geram outro aviso. */
const INTERVALO_PEDIDO_MS = 10 * 60_000;

function situacaoDe(t: TarefaDoAluno): SituacaoTarefa {
  if (t.concluida) return 'concluida';
  return t.iniciadoEm || t.passosFeitos > 0 ? 'em-andamento' : 'pendente';
}

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return (
    (partes[0]?.[0] ?? '') +
    (partes.length > 1 ? partes[partes.length - 1][0] : '')
  ).toUpperCase();
}

function listaInteresses(texto: string | null): string[] {
  return texto
    ? texto
        .split(',')
        .map((i) => i.trim())
        .filter(Boolean)
    : [];
}

/** Telas "Aluno - ..." do Figma. Tudo e do aluno ligado ao login. */
@Injectable()
export class PainelAlunoService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly ia: AdaptacaoIaService,
    private readonly avisos: AvisosFamiliaService,
  ) {}

  // ------------------------------------------------------------ leitura

  private async alunoDoUsuario(usuarioId: number) {
    const aluno = await this.dataSource
      .getRepository(Aluno)
      .findOne({ where: { usuarioId, ativo: true } });
    if (!aluno) throw new NotFoundException('Aluno nao encontrado');

    const [turma]: { id: number; nome: string }[] = await this.dataSource.query(
      `SELECT t.id, t.nome FROM matricula m JOIN turma t ON t.id = m.turma_id
        WHERE m.aluno_id = ? LIMIT 1`,
      [aluno.id],
    );

    return { aluno, turma: turma ?? null };
  }

  /** Todas as tarefas do aluno (as que tem linha em tarefa_status). */
  /** Usado tambem pelo painel da familia (mesmas contas, a partir do id). */
  async tarefasDoAluno(alunoId: number): Promise<TarefaDoAluno[]> {
    const linhas: LinhaBanco[] = await this.dataSource.query(
      `SELECT t.id, t.turma_id turmaId, t.titulo, t.descricao,
              t.data_entrega dataEntrega, t.hora_limite horaLimite,
              d.nome disciplina, p.nome_completo professor,
              ts.status, ts.concluido_em concluidoEm, ts.iniciado_em iniciadoEm,
              ts.iniciou_sozinho iniciouSozinho, ts.passos_feitos passosFeitos,
              ts.resposta, ts.resposta_em respostaEm
         FROM tarefa_status ts
         JOIN tarefa t ON t.id = ts.tarefa_id
         LEFT JOIN disciplina d ON d.id = t.disciplina_id
         LEFT JOIN professor p ON p.id = t.professor_id
        WHERE ts.aluno_id = ?`,
      [alunoId],
    );
    if (linhas.length === 0) return [];

    const adaptadas = await this.dataSource.getRepository(TarefaAdaptada).find({
      where: { alunoId, tarefaId: In(linhas.map((l) => l.id)) },
    });
    // mysql2 devolve BIGINT como texto: ids sempre normalizados para numero.
    const porTarefa = new Map(adaptadas.map((a) => [Number(a.tarefaId), a]));

    return linhas.map((l) => {
      const ad = porTarefa.get(Number(l.id));
      const passos = ad?.passos?.length
        ? ad.passos
        : [htmlParaTexto(l.descricao) || l.titulo];
      return {
        id: Number(l.id),
        turmaId: Number(l.turmaId),
        titulo: l.titulo,
        descricao: l.descricao,
        dataEntrega: l.dataEntrega ? paraIso(l.dataEntrega) : null,
        horaLimite: l.horaLimite ? l.horaLimite.slice(0, 5) : null,
        disciplina: l.disciplina,
        professor: l.professor,
        concluida: l.status === 'concluida',
        concluidoEm: l.concluidoEm,
        iniciadoEm: l.iniciadoEm,
        iniciouSozinho:
          l.iniciouSozinho === null ? null : Boolean(l.iniciouSozinho),
        passosFeitos: Math.min(Number(l.passosFeitos) || 0, passos.length),
        passos,
        materiais: ad?.materiais ?? [],
        totalPassos: passos.length,
        resposta: l.resposta,
        respostaEm: l.respostaEm,
      };
    });
  }

  paraLinhas(alunoId: number, tarefas: TarefaDoAluno[]): LinhaTarefa[] {
    return tarefas
      .filter((t) => t.dataEntrega)
      .map((t) => ({
        alunoId,
        tarefaId: t.id,
        turmaId: t.turmaId,
        dataEntrega: t.dataEntrega!,
        horaLimite: t.horaLimite,
        concluida: t.concluida,
        concluidoEm: t.concluidoEm,
      }));
  }

  resumoTarefa(t: TarefaDoAluno) {
    return {
      id: t.id,
      titulo: t.titulo,
      disciplina: t.disciplina,
      dataEntrega: t.dataEntrega,
      horaLimite: t.horaLimite,
      situacao: situacaoDe(t),
      passosFeitos: t.passosFeitos,
      totalPassos: t.totalPassos,
      concluidoEm: t.concluidoEm,
      entregue: t.respostaEm !== null,
    };
  }

  placar(tarefas: TarefaDoAluno[], hoje = new Date()) {
    const p = pontos(tarefas, hoje);
    const datas = tarefas.flatMap((t) =>
      t.concluidoEm ? [t.concluidoEm] : [],
    );
    return {
      pontos: p,
      nivel: nivel(p.total),
      sequencia: {
        atual: sequenciaAtual(datas, hoje),
        recorde: maiorSequencia(datas),
      },
    };
  }

  // ------------------------------------------------------------ telas

  /** Moldura + Inicio + Minhas tarefas. */
  async resumo(usuarioId: number) {
    const { aluno, turma } = await this.alunoDoUsuario(usuarioId);
    const tarefas = await this.tarefasDoAluno(aluno.id);
    const hoje = new Date();
    const semana = semanaDe(hoje);

    // Pendentes de qualquer data + concluidas recentes (ultimas 2 semanas).
    const corte = new Date(hoje);
    corte.setDate(corte.getDate() - 14);
    const visiveis = tarefas
      .filter(
        (t) =>
          !t.concluida ||
          (t.concluidoEm && t.concluidoEm >= corte) ||
          (t.dataEntrega && t.dataEntrega >= iso(corte)),
      )
      .sort(
        (a, b) =>
          (a.dataEntrega ?? '9999').localeCompare(b.dataEntrega ?? '9999') ||
          (a.horaLimite ?? '99').localeCompare(b.horaLimite ?? '99') ||
          a.id - b.id,
      );

    return {
      data: {
        aluno: {
          id: Number(aluno.id),
          nome: aluno.nomeCompleto,
          primeiroNome: aluno.nomeCompleto.split(' ')[0],
          iniciais: iniciais(aluno.nomeCompleto),
          turma: turma?.nome ?? null,
          idade: aluno.data_nascimento
            ? Math.floor(
                (hoje.getTime() -
                  new Date(`${aluno.data_nascimento}T12:00:00`).getTime()) /
                  (365.25 * 86_400_000),
              )
            : null,
        },
        preferencias: { ...PREFERENCIAS_PADRAO, ...(aluno.preferencias ?? {}) },
        interesses: listaInteresses(aluno.interesses),
        ...this.placar(tarefas, hoje),
        semana: taxaConclusao(
          this.paraLinhas(aluno.id, tarefas).filter((l) =>
            noIntervalo(l.dataEntrega, semana),
          ),
          hoje,
        ),
        tarefas: visiveis.map((t) => this.resumoTarefa(t)),
        incentivos: await this.incentivosNaoLidos(aluno.id),
        avisosNaoLidos: await this.avisosNaoLidos(aluno.id, turma?.id ?? null),
      },
    };
  }

  /** Recados da familia que o aluno ainda nao viu (o mascote le em voz alta). */
  private async incentivosNaoLidos(alunoId: number) {
    const linhas: {
      id: number;
      mensagem: string;
      voz: number;
      criadoEm: Date;
      parentesco: string | null;
      nome: string | null;
    }[] = await this.dataSource.query(
      `SELECT i.id, i.mensagem, i.voz, i.criado_em criadoEm, r.parentesco,
              r.nome_completo nome
         FROM incentivo i JOIN responsavel r ON r.id = i.responsavel_id
        WHERE i.aluno_id = ? AND i.lido_em IS NULL
          AND i.criado_em >= NOW() - INTERVAL 3 DAY
        ORDER BY i.criado_em DESC LIMIT 5`,
      [alunoId],
    );
    return linhas.map((l) => ({
      id: Number(l.id),
      mensagem: l.mensagem,
      voz: Boolean(Number(l.voz)),
      criadoEm: l.criadoEm,
      de: l.parentesco || l.nome?.split(' ')[0] || 'Sua família',
    }));
  }

  async marcarIncentivoLido(usuarioId: number, incentivoId: number) {
    const { aluno } = await this.alunoDoUsuario(usuarioId);
    const r = await this.dataSource
      .getRepository(Incentivo)
      .update(
        { id: incentivoId, alunoId: aluno.id, lidoEm: IsNull() },
        { lidoEm: new Date() },
      );
    if (!r.affected) throw new NotFoundException('Recado nao encontrado');
    return { data: true };
  }

  /**
   * "Iniciou sozinho" = comecou sem incentivo da familia antes: nem um para
   * esta tarefa, nem um recado geral do mesmo dia.
   */
  private async comecouSemIncentivo(
    alunoId: number,
    tarefaId: number,
    agora: Date,
  ): Promise<boolean> {
    const [{ total }]: { total: number }[] = await this.dataSource.query(
      `SELECT COUNT(*) total FROM incentivo
        WHERE aluno_id = ? AND criado_em <= ?
          AND (tarefa_id = ? OR (tarefa_id IS NULL AND DATE(criado_em) = DATE(?)))`,
      [alunoId, agora, tarefaId, agora],
    );
    return Number(total) === 0;
  }

  private async tarefaDoAluno(usuarioId: number, tarefaId: number) {
    const { aluno } = await this.alunoDoUsuario(usuarioId);
    const tarefas = await this.tarefasDoAluno(aluno.id);
    const tarefa = tarefas.find((t) => t.id === tarefaId);
    if (!tarefa) throw new NotFoundException('Tarefa nao encontrada');
    return { aluno, tarefa, tarefas };
  }

  async tarefa(usuarioId: number, tarefaId: number) {
    const { tarefa: t } = await this.tarefaDoAluno(usuarioId, tarefaId);
    return {
      data: {
        ...this.resumoTarefa(t),
        objetivo: htmlParaTexto(t.descricao) || t.titulo,
        /** Enunciado com a formatacao do professor (HTML limpo). */
        enunciadoHtml: t.descricao ? limparHtml(t.descricao) : null,
        professor: t.professor,
        passos: t.passos,
        materiais: t.materiais,
        resposta: t.resposta,
        respostaEm: t.respostaEm,
        iaDisponivel: this.ia.disponivel,
      },
    };
  }

  /** O aluno entrega (ou reenvia) uma resposta escrita da tarefa. */
  async entregarResposta(
    usuarioId: number,
    tarefaId: number,
    resposta: string,
  ) {
    const { aluno } = await this.tarefaDoAluno(usuarioId, tarefaId);
    const limpa = limparHtml(resposta);
    if (!temTexto(limpa)) {
      throw new BadRequestException('Escreva a resposta antes de enviar');
    }
    await this.dataSource.query(
      `UPDATE tarefa_status SET resposta = ?, resposta_em = NOW()
        WHERE aluno_id = ? AND tarefa_id = ?`,
      [limpa, aluno.id, tarefaId],
    );
    return { data: { entregue: true } };
  }

  /** Avisos da turma do aluno; NEE ve a versao simplificada quando houver. */
  async listarAvisos(usuarioId: number) {
    const { aluno, turma } = await this.alunoDoUsuario(usuarioId);
    if (!turma) return { data: { avisos: [] } };
    const linhas: {
      id: number;
      tipo: string;
      titulo: string;
      mensagem: string;
      simplificada: string | null;
      enviadoEm: Date;
      professor: string | null;
      lidoEm: Date | null;
    }[] = await this.dataSource.query(
      `SELECT c.id, c.tipo, c.titulo, c.mensagem, c.versao_simplificada simplificada,
              c.enviado_em enviadoEm, p.nome_completo professor, l.lido_em lidoEm
         FROM comunicado c
         LEFT JOIN professor p ON p.id = c.professor_id
         LEFT JOIN comunicado_leitura_aluno l ON l.comunicado_id = c.id AND l.aluno_id = ?
        WHERE c.turma_id = ? AND c.rascunho = 0 AND c.enviado_em IS NOT NULL
        ORDER BY c.enviado_em DESC LIMIT 50`,
      [aluno.id, turma.id],
    );
    return {
      data: {
        avisos: linhas.map((a) => ({
          id: Number(a.id),
          tipo: a.tipo,
          titulo: a.titulo,
          mensagemHtml: limparHtml(a.mensagem),
          /** Texto para ler em voz alta (simplificado para NEE quando houver). */
          texto:
            aluno.neurodivergente && a.simplificada
              ? a.simplificada
              : htmlParaTexto(a.mensagem),
          simplificada: aluno.neurodivergente ? a.simplificada : null,
          enviadoEm: a.enviadoEm,
          autor: a.professor ?? 'Coordenação',
          lido: a.lidoEm !== null,
        })),
      },
    };
  }

  async marcarAvisoLido(usuarioId: number, comunicadoId: number) {
    const { aluno, turma } = await this.alunoDoUsuario(usuarioId);
    const [aviso]: unknown[] = turma
      ? await this.dataSource.query(
          `SELECT 1 FROM comunicado WHERE id = ? AND turma_id = ?
              AND rascunho = 0 AND enviado_em IS NOT NULL`,
          [comunicadoId, turma.id],
        )
      : [];
    if (!aviso) throw new NotFoundException('Aviso nao encontrado');
    await this.dataSource.query(
      'INSERT IGNORE INTO comunicado_leitura_aluno (comunicado_id, aluno_id) VALUES (?, ?)',
      [comunicadoId, aluno.id],
    );
    return { data: true };
  }

  private async avisosNaoLidos(alunoId: number, turmaId: number | null) {
    if (!turmaId) return 0;
    const [{ total }]: { total: number }[] = await this.dataSource.query(
      `SELECT COUNT(*) total FROM comunicado c
         LEFT JOIN comunicado_leitura_aluno l ON l.comunicado_id = c.id AND l.aluno_id = ?
        WHERE c.turma_id = ? AND c.rascunho = 0 AND c.enviado_em IS NOT NULL
          AND l.aluno_id IS NULL`,
      [alunoId, turmaId],
    );
    return Number(total);
  }

  /** Conclui o passo `passo` (1..n), sempre em ordem. O ultimo conclui a tarefa. */
  async concluirPasso(
    usuarioId: number,
    tarefaId: number,
    passo: number,
    feitoEm?: string,
  ) {
    const { aluno, tarefa, tarefas } = await this.tarefaDoAluno(
      usuarioId,
      tarefaId,
    );
    if (tarefa.concluida)
      throw new BadRequestException('Esta tarefa ja foi concluida');
    if (passo !== tarefa.passosFeitos + 1 || passo > tarefa.totalPassos)
      throw new BadRequestException('Conclua os passos na ordem');

    // Hora real do passo (pode ter sido feito sem internet).
    const quando = momentoDoPasso(feitoEm);
    const ultimo = passo === tarefa.totalPassos;
    // O primeiro passo marca o inicio; incentivo antes dele = "com lembrete".
    const sozinho = tarefa.iniciadoEm
      ? tarefa.iniciouSozinho
      : await this.comecouSemIncentivo(aluno.id, tarefaId, quando);
    await this.dataSource.getRepository(TarefaStatusEntity).update(
      { alunoId: aluno.id, tarefaId },
      {
        passosFeitos: passo,
        ...(tarefa.iniciadoEm
          ? {}
          : { iniciado_em: quando, iniciouSozinho: sozinho }),
        ...(ultimo
          ? { status: 'concluida' as const, concluido_em: quando }
          : {}),
      },
    );

    if (!ultimo) return { data: { passosFeitos: passo, concluida: false } };
    this.avisos.tarefaConcluida(aluno.id, tarefaId);

    const atualizada: TarefaDoAluno = {
      ...tarefa,
      concluida: true,
      concluidoEm: quando,
      iniciadoEm: tarefa.iniciadoEm ?? quando,
      iniciouSozinho: sozinho,
      passosFeitos: passo,
    };
    const todas = tarefas.map((t) => (t.id === tarefaId ? atualizada : t));
    return {
      data: {
        passosFeitos: passo,
        concluida: true,
        ganhos: pontosDaTarefa(atualizada),
        comecouSozinho: atualizada.iniciouSozinho === true,
        ...this.placar(todas, new Date()),
        quaseLa: conquistaQuaseLa(conquistas(todas)),
      },
    };
  }

  async ajuda(usuarioId: number, tarefaId: number, dto: AjudaDto) {
    const { aluno, tarefa } = await this.tarefaDoAluno(usuarioId, tarefaId);
    const passo = tarefa.passos[dto.passo - 1];
    if (!passo) throw new BadRequestException('Passo invalido');

    if (dto.tipo === 'professora') {
      const repo = this.dataSource.getRepository(PedidoAjuda);
      const recente = await repo.findOne({
        where: {
          alunoId: aluno.id,
          tarefaId,
          criadoEm: MoreThan(new Date(Date.now() - INTERVALO_PEDIDO_MS)),
        },
      });
      if (!recente)
        await repo.save(
          repo.create({ alunoId: aluno.id, tarefaId, passo: dto.passo }),
        );
      return { data: { enviado: true, professor: tarefa.professor } };
    }

    const linhasDiag: { nome: string }[] = await this.dataSource.query(
      `SELECT n.nome FROM aluno_neurodivergencia an
         JOIN neurodivergencia n ON n.id = an.neurodivergencia_id
        WHERE an.aluno_id = ?`,
      [aluno.id],
    );
    const diagnosticos = linhasDiag.map((d) => d.nome);

    const resposta = await this.ia.ajudarPasso({
      tipo: dto.tipo,
      tarefa: {
        titulo: tarefa.titulo,
        disciplina: tarefa.disciplina,
        enunciado: htmlParaTexto(tarefa.descricao) || tarefa.titulo,
      },
      passo,
      aluno: {
        primeiroNome: aluno.nomeCompleto.split(' ')[0],
        diagnosticos,
        interesses: listaInteresses(aluno.interesses),
      },
    });
    return { data: resposta };
  }

  async progresso(usuarioId: number) {
    const { aluno } = await this.alunoDoUsuario(usuarioId);
    const tarefas = await this.tarefasDoAluno(aluno.id);
    const linhas = this.paraLinhas(aluno.id, tarefas);
    const hoje = new Date();
    const diaHoje = iso(hoje);
    const semana = semanaDe(hoje);
    const mes = mesDe(mesAtual(hoje));

    const concluidasEm = (dia: string) =>
      tarefas.filter((t) => t.concluidoEm && iso(t.concluidoEm) === dia).length;

    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(`${semana[0]}T12:00:00`);
      d.setDate(d.getDate() + i);
      const dia = iso(d);
      const feitas = concluidasEm(dia);
      const pendentesHoje =
        dia === diaHoje &&
        tarefas.some((t) => !t.concluida && t.dataEntrega === dia);
      return {
        data: dia,
        rotulo: DIAS[d.getDay()],
        estado:
          dia === diaHoje
            ? pendentesHoje || !feitas
              ? 'hoje'
              : 'feito'
            : dia < diaHoje && feitas
              ? 'feito'
              : 'vazio',
      };
    });

    const porMateria = new Map<string, LinhaTarefa[]>();
    for (const t of tarefas) {
      if (!t.dataEntrega || !noIntervalo(t.dataEntrega, mes)) continue;
      const chave = t.disciplina ?? 'Outras';
      const linha = linhas.find((l) => l.tarefaId === t.id)!;
      porMateria.set(chave, [...(porMateria.get(chave) ?? []), linha]);
    }

    // Concluidas nas ultimas 4 semanas (segunda a domingo).
    const porSemana = Array.from({ length: 4 }, (_, i) => {
      const ref = new Date(hoje);
      ref.setDate(ref.getDate() - 7 * (3 - i));
      const [ini, fim] = semanaDe(ref);
      return {
        rotulo: `Sem ${i + 1}`,
        inicio: ini,
        concluidas: tarefas.filter(
          (t) => t.concluidoEm && noIntervalo(iso(t.concluidoEm), [ini, fim]),
        ).length,
      };
    });

    return {
      data: {
        ...this.placar(tarefas, hoje),
        semana: taxaConclusao(
          linhas.filter((l) => noIntervalo(l.dataEntrega, semana)),
          hoje,
        ),
        concluidasMes: tarefas.filter(
          (t) => t.concluidoEm && noIntervalo(iso(t.concluidoEm), mes),
        ).length,
        dias,
        porMateria: [...porMateria.entries()]
          .map(([disciplina, ls]) => ({
            disciplina,
            taxa: taxaConclusao(ls, hoje),
          }))
          .sort((a, b) => a.disciplina.localeCompare(b.disciplina)),
        porSemana,
      },
    };
  }

  async conquistas(usuarioId: number) {
    const { aluno } = await this.alunoDoUsuario(usuarioId);
    const tarefas = await this.tarefasDoAluno(aluno.id);
    const lista = conquistas(tarefas);
    return {
      data: {
        ...this.placar(tarefas),
        desbloqueadas: lista.filter((c) => c.desbloqueada).length,
        conquistas: lista,
      },
    };
  }

  /** Semana (segunda a sexta) com as tarefas e os lembretes do aluno. */
  async agenda(usuarioId: number, referencia?: string) {
    const { aluno } = await this.alunoDoUsuario(usuarioId);
    const tarefas = await this.tarefasDoAluno(aluno.id);
    const base = referencia ? new Date(`${referencia}T12:00:00`) : new Date();
    if (Number.isNaN(base.getTime()))
      throw new BadRequestException('Data invalida');
    const [inicio] = semanaDe(base);

    const dias = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(`${inicio}T12:00:00`);
      d.setDate(d.getDate() + i);
      const dia = iso(d);
      return {
        data: dia,
        rotulo: DIAS[d.getDay()],
        tarefas: tarefas
          .filter((t) => t.dataEntrega === dia)
          .sort((a, b) =>
            (a.horaLimite ?? '99').localeCompare(b.horaLimite ?? '99'),
          )
          .map((t) => this.resumoTarefa(t)),
      };
    });

    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    const lembretes = await this.dataSource.getRepository(AlunoLembrete).find({
      where: { alunoId: aluno.id, quando: MoreThan(desde) },
      order: { quando: 'ASC' },
      take: 20,
    });

    return {
      data: {
        inicio,
        fim: dias[4].data,
        dias,
        lembretes: lembretes.map((l) => ({
          id: Number(l.id),
          texto: l.texto,
          quando: l.quando,
        })),
      },
    };
  }

  async criarLembrete(usuarioId: number, dto: LembreteDto) {
    const { aluno } = await this.alunoDoUsuario(usuarioId);
    const quando = new Date(dto.quando);
    if (Number.isNaN(quando.getTime()))
      throw new BadRequestException('Data invalida');

    const repo = this.dataSource.getRepository(AlunoLembrete);
    const salvo = await repo.save(
      repo.create({ alunoId: aluno.id, texto: dto.texto.trim(), quando }),
    );
    return {
      data: { id: Number(salvo.id), texto: salvo.texto, quando: salvo.quando },
    };
  }

  async removerLembrete(usuarioId: number, id: number) {
    const { aluno } = await this.alunoDoUsuario(usuarioId);
    const r = await this.dataSource
      .getRepository(AlunoLembrete)
      .delete({ id, alunoId: aluno.id });
    if (!r.affected) throw new NotFoundException('Lembrete nao encontrado');
    return { data: true };
  }

  /** "Meu perfil": como gosta de aprender, mascote e interesses. */
  async salvarPreferencias(usuarioId: number, dto: PreferenciasDto) {
    const { aluno } = await this.alunoDoUsuario(usuarioId);
    const { interesses, ...prefs } = dto;
    const atuais: PreferenciasAluno = {
      ...PREFERENCIAS_PADRAO,
      ...(aluno.preferencias ?? {}),
    };

    await this.dataSource.getRepository(Aluno).update(aluno.id, {
      preferencias: { ...atuais, ...prefs },
      ...(interesses !== undefined ? perfilParaColunas({ interesses }) : {}),
    });
    return this.resumo(usuarioId);
  }
}

/** Ate quanto tempo atras um passo feito sem internet ainda vale. */
const LIMITE_OFFLINE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Hora do passo: a que o aluno informou (feito sem internet) se for dos
 * ultimos 7 dias e nao estiver no futuro; senao, a hora de agora.
 */
export function momentoDoPasso(feitoEm?: string, agora = new Date()): Date {
  const quando = feitoEm ? new Date(feitoEm) : null;
  return quando &&
    !Number.isNaN(quando.getTime()) &&
    quando <= agora &&
    agora.getTime() - quando.getTime() <= LIMITE_OFFLINE_MS
    ? quando
    : agora;
}

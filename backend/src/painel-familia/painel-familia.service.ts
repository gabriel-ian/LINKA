import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { Responsavel } from '../responsavel/responsavel.entity';
import { Usuario } from '../usuario/usuario.entity';
import {
  PainelAlunoService,
  TarefaDoAluno,
} from '../painel-aluno/painel-aluno.service';
import {
  LinhaTarefa,
  iso,
  maiorSequencia,
  mesAtual,
  mesDe,
  mesesAte,
  noIntervalo,
  semanaDe,
  taxaConclusao,
} from '../painel-escola/metricas';
import { semanasDoMes } from '../painel-professor/painel-professor.service';
import { sequenciaAtual } from '../painel-aluno/gamificacao';
import { Incentivo } from './incentivo.entity';
import { EntregaArquivoService } from '../tarefa-anexo/entrega-arquivo.service';
import { resumoSemanal } from './resumo-semanal';
import { LgpdService, TERMO_VERSAO } from '../lgpd/lgpd.service';
import { PREFERENCIAS_PADRAO, preferenciasDe } from './preferencias';
import { EnviarIncentivoDto, PerfilFamiliaDto } from './dto/painel-familia.dto';
import { htmlParaTexto, limparHtml } from '../comum/html';

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function iniciais(nome: string): string {
  const p = nome.trim().split(/\s+/);
  return (
    (p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')
  ).toUpperCase();
}

function hora(d: Date): string {
  return `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
}

function horaLimite(h: string | null): string {
  if (!h) return '';
  const [hh, mm] = h.split(':');
  return `${Number(hh)}h${mm && mm !== '00' ? mm : ''}`;
}

/**
 * Telas "Familia - ..." do Figma. O responsavel vem do token e so enxerga
 * os filhos ligados a ele em aluno_responsavel.
 */
@Injectable()
export class PainelFamiliaService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly aluno: PainelAlunoService,
    private readonly lgpd: LgpdService,
    private readonly entregas: EntregaArquivoService,
  ) {}

  // ------------------------------------------------------------ acesso

  private async responsavel(usuarioId: number) {
    const r = await this.dataSource
      .getRepository(Responsavel)
      .findOne({ where: { usuarioId } });
    if (!r) throw new NotFoundException('Responsavel nao encontrado');
    return r;
  }

  private async filhos(responsavelId: number) {
    const linhas: {
      id: number;
      nome: string;
      turmaId: number | null;
      turma: string | null;
      escola: string;
    }[] = await this.dataSource.query(
      `SELECT a.id, a.nome_completo nome, t.id turmaId, t.nome turma, e.nome escola
         FROM aluno_responsavel ar
         JOIN aluno a ON a.id = ar.aluno_id AND a.ativo = 1
         JOIN escola e ON e.id = a.escola_id
         LEFT JOIN matricula m ON m.aluno_id = a.id
         LEFT JOIN turma t ON t.id = m.turma_id
        WHERE ar.responsavel_id = ?
        ORDER BY a.nome_completo`,
      [responsavelId],
    );
    return linhas.map((l) => ({
      id: Number(l.id),
      nome: l.nome,
      primeiroNome: l.nome.split(' ')[0],
      iniciais: iniciais(l.nome),
      turmaId: l.turmaId === null ? null : Number(l.turmaId),
      turma: l.turma,
      escola: l.escola,
    }));
  }

  /** O filho precisa estar ligado ao responsavel do token; senao 404. */
  private async filho(usuarioId: number, alunoId: number) {
    const resp = await this.responsavel(usuarioId);
    const filho = (await this.filhos(resp.id)).find((f) => f.id === alunoId);
    if (!filho) throw new NotFoundException('Aluno nao encontrado');
    return { resp, filho };
  }

  // ------------------------------------------------------------ telas

  async contexto(usuarioId: number) {
    const r = await this.responsavel(usuarioId);
    const usuario = r.usuarioId
      ? await this.dataSource
          .getRepository(Usuario)
          .findOne({ where: { id: r.usuarioId } })
      : null;
    const nome = r.nomeCompleto ?? 'Família';
    return {
      data: {
        responsavel: {
          id: Number(r.id),
          nome,
          iniciais: iniciais(nome),
          sobrenome: nome.trim().split(/\s+/).pop() ?? '',
          email: usuario?.email ?? null,
          telefone: r.telefone,
          parentesco: r.parentesco,
          preferencias: { ...PREFERENCIAS_PADRAO, ...(r.preferencias ?? {}) },
        },
        filhos: await this.filhos(r.id),
        /** Precisa aceitar o termo (versao atual) antes de usar o painel. */
        termo: {
          versao: TERMO_VERSAO,
          pendente: await this.lgpd.termoPendente(Number(r.id)),
        },
      },
    };
  }

  /** "Familia - Painel": numeros, tarefas, autonomia e linha do tempo de hoje. */
  async painel(usuarioId: number, alunoId: number) {
    const { resp, filho } = await this.filho(usuarioId, alunoId);
    const tarefas = await this.aluno.tarefasDoAluno(alunoId);
    const linhas = this.aluno.paraLinhas(alunoId, tarefas);
    const hoje = new Date();
    const dia = iso(hoje);
    const semana = semanaDe(hoje);
    const mes = mesDe(mesAtual(hoje));

    const incentivosHoje: { tarefaId: number | null; criadoEm: Date }[] =
      await this.dataSource.query(
        `SELECT tarefa_id tarefaId, criado_em criadoEm FROM incentivo
          WHERE aluno_id = ? AND DATE(criado_em) = CURDATE() ORDER BY criado_em`,
        [alunoId],
      );

    const daSemana = tarefas.filter(
      (t) => t.dataEntrega && noIntervalo(t.dataEntrega, semana),
    );
    const naoIniciadas = daSemana.filter(
      (t) => !t.concluida && !t.iniciadoEm && t.dataEntrega! <= dia,
    );

    // Pendentes de hoje/atrasadas + concluidas hoje + proximos 7 dias.
    const limite = new Date(hoje);
    limite.setDate(limite.getDate() + 7);
    const visiveis = tarefas
      .filter(
        (t) =>
          (t.concluidoEm && iso(t.concluidoEm) === dia) ||
          (!t.concluida && (!t.dataEntrega || t.dataEntrega <= iso(limite))),
      )
      .sort(
        (a, b) =>
          (a.dataEntrega ?? '9999').localeCompare(b.dataEntrega ?? '9999') ||
          (a.horaLimite ?? '99').localeCompare(b.horaLimite ?? '99'),
      );

    const alerta =
      tarefas
        .filter((t) => t.dataEntrega === dia && !t.concluida && !t.iniciadoEm)
        .sort((a, b) =>
          (a.horaLimite ?? '99').localeCompare(b.horaLimite ?? '99'),
        )[0] ?? null;

    const [{ naoLidos }]: { naoLidos: number }[] = filho.turmaId
      ? await this.dataSource.query(
          `SELECT COUNT(*) naoLidos FROM comunicado c
            WHERE c.turma_id = ? AND c.rascunho = 0 AND c.enviado_em IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM comunicado_leitura cl
                               WHERE cl.comunicado_id = c.id AND cl.responsavel_id = ?)`,
          [filho.turmaId, resp.id],
        )
      : [{ naoLidos: 0 }];

    return {
      data: {
        filho,
        ...this.aluno.placar(tarefas, hoje),
        semana: taxaConclusao(
          linhas.filter((l) => noIntervalo(l.dataEntrega, semana)),
          hoje,
        ),
        avisosNaoLidos: Number(naoLidos),
        alerta: alerta ? this.aluno.resumoTarefa(alerta) : null,
        tarefas: visiveis.map((t) => this.aluno.resumoTarefa(t)),
        autonomia: {
          sozinho: daSemana.filter((t) => t.iniciouSozinho === true).length,
          comLembrete: daSemana.filter((t) => t.iniciouSozinho === false)
            .length,
          naoIniciada: naoIniciadas.length,
        },
        porMateria: this.porMateria(tarefas, linhas, mes, hoje),
        linhaDoTempo: this.linhaDoTempo(tarefas, incentivosHoje, hoje),
      },
    };
  }

  /** Todas as tarefas do filho, separadas para a tela "Tarefas" da familia. */
  async tarefas(usuarioId: number, alunoId: number) {
    const { filho } = await this.filho(usuarioId, alunoId);
    const tarefas = await this.aluno.tarefasDoAluno(alunoId);
    const dia = iso(new Date());
    const porPrazo = (a: TarefaDoAluno, b: TarefaDoAluno) =>
      (a.dataEntrega ?? '9999').localeCompare(b.dataEntrega ?? '9999') ||
      (a.horaLimite ?? '99').localeCompare(b.horaLimite ?? '99');
    const pendentes = tarefas.filter((t) => !t.concluida).sort(porPrazo);
    const feitas = tarefas
      .filter((t) => t.concluida)
      .sort(
        (a, b) =>
          (b.concluidoEm?.getTime() ?? 0) - (a.concluidoEm?.getTime() ?? 0),
      );
    const enviados = new Map(
      await Promise.all(
        tarefas
          .filter((t) => t.arquivosEnviados > 0)
          .map(
            async (t) =>
              [t.id, await this.entregas.listar(t.id, alunoId)] as const,
          ),
      ),
    );
    const item = (t: TarefaDoAluno) => ({
      ...this.aluno.resumoTarefa(t),
      professor: t.professor,
      respostaEm: t.respostaEm,
      /** Fotos ou documentos que o filho enviou e o comentario do professor. */
      arquivos: enviados.get(t.id) ?? [],
      comentario: t.comentario,
      comentarioEm: t.comentarioEm,
    });
    return {
      data: {
        filho,
        atrasadas: pendentes
          .filter((t) => t.dataEntrega && t.dataEntrega < dia)
          .map(item),
        aFazer: pendentes
          .filter((t) => !t.dataEntrega || t.dataEntrega >= dia)
          .map(item),
        feitas: feitas.slice(0, 50).map(item),
      },
    };
  }

  private porMateria(
    tarefas: TarefaDoAluno[],
    linhas: LinhaTarefa[],
    intervalo: [string, string],
    hoje: Date,
  ) {
    const grupos = new Map<string, LinhaTarefa[]>();
    for (const t of tarefas) {
      if (!t.dataEntrega || !noIntervalo(t.dataEntrega, intervalo)) continue;
      const linha = linhas.find((l) => l.tarefaId === t.id);
      if (!linha) continue;
      const chave = t.disciplina ?? 'Outras';
      grupos.set(chave, [...(grupos.get(chave) ?? []), linha]);
    }
    return [...grupos.entries()]
      .map(([disciplina, ls]) => ({
        disciplina,
        taxa: taxaConclusao(ls, hoje),
      }))
      .sort((a, b) => a.disciplina.localeCompare(b.disciplina));
  }

  /** Eventos de hoje, do mais antigo ao mais novo, e o que ainda falta. */
  private linhaDoTempo(
    tarefas: TarefaDoAluno[],
    incentivos: { tarefaId: number | null; criadoEm: Date }[],
    hoje: Date,
  ) {
    const dia = iso(hoje);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    const eventos: {
      cor: 'verde' | 'laranja' | 'cinza';
      titulo: string;
      detalhe: string;
      quando: number;
    }[] = [];

    for (const t of tarefas) {
      const materia = t.disciplina ?? 'Tarefa';
      if (t.concluidoEm && iso(t.concluidoEm) === dia) {
        eventos.push({
          cor: 'verde',
          titulo: `${t.titulo} concluída`,
          detalhe: `${hora(t.concluidoEm)} - ${materia} - ${
            t.iniciouSozinho === false
              ? 'Começou depois do incentivo'
              : 'Iniciou sozinho(a)'
          }`,
          quando: t.concluidoEm.getTime(),
        });
      } else if (!t.concluida && t.iniciadoEm && iso(t.iniciadoEm) === dia) {
        eventos.push({
          cor: 'verde',
          titulo: `${t.titulo} em andamento`,
          detalhe: `Começou às ${hora(t.iniciadoEm)} - ${t.passosFeitos} de ${t.totalPassos} passos`,
          quando: t.iniciadoEm.getTime(),
        });
      } else if (!t.concluida && !t.iniciadoEm && t.dataEntrega === dia) {
        const incentivo = incentivos.find(
          (i) => i.tarefaId !== null && Number(i.tarefaId) === t.id,
        );
        eventos.push({
          cor: 'laranja',
          // O titulo distingue duas tarefas da mesma materia no mesmo dia.
          titulo: `${t.titulo} ainda não iniciada`,
          detalhe:
            `Prazo: ${horaLimite(t.horaLimite) || 'hoje'} - ${materia}` +
            (incentivo
              ? ` - Incentivo enviado às ${hora(incentivo.criadoEm)}`
              : ''),
          quando: Number.MAX_SAFE_INTEGER - 1,
        });
      } else if (!t.concluida && t.dataEntrega === iso(amanha)) {
        eventos.push({
          cor: 'cinza',
          titulo: t.titulo,
          detalhe: `Prazo: amanhã - ${t.iniciadoEm ? 'Já começou' : 'Ainda não iniciado'}`,
          quando: Number.MAX_SAFE_INTEGER,
        });
      }
    }

    return eventos
      .sort((a, b) => a.quando - b.quando)
      .slice(0, 6)
      .map(({ quando: _, ...e }) => e);
  }

  /** Foto ou documento que o filho enviou da tarefa. */
  async entregaParaBaixar(
    usuarioId: number,
    alunoId: number,
    tarefaId: number,
    arquivoId: number,
  ) {
    await this.filho(usuarioId, alunoId);
    return this.entregas.paraBaixar(tarefaId, alunoId, arquivoId);
  }

  async enviarIncentivo(
    usuarioId: number,
    alunoId: number,
    dto: EnviarIncentivoDto,
  ) {
    const { resp } = await this.filho(usuarioId, alunoId);
    if (dto.tarefaId !== undefined) {
      const tarefas = await this.aluno.tarefasDoAluno(alunoId);
      if (!tarefas.some((t) => t.id === dto.tarefaId))
        throw new BadRequestException('Tarefa invalida');
    }
    const repo = this.dataSource.getRepository(Incentivo);
    const salvo = await repo.save(
      repo.create({
        responsavelId: resp.id,
        alunoId,
        tarefaId: dto.tarefaId ?? null,
        mensagem: dto.mensagem.trim(),
        voz: dto.voz ?? true,
      }),
    );
    return {
      data: {
        id: Number(salvo.id),
        mensagem: salvo.mensagem,
        voz: Boolean(salvo.voz),
      },
    };
  }

  /** "Familia - Avisos da escola": avisos da turma do filho, lidos e nao lidos. */
  async avisos(usuarioId: number, alunoId: number) {
    const { resp, filho } = await this.filho(usuarioId, alunoId);
    const avisos: {
      id: number;
      tipo: string;
      titulo: string;
      mensagem: string;
      simplificada: string | null;
      enviadoEm: Date;
      professor: string | null;
      lidoEm: Date | null;
    }[] = filho.turmaId
      ? await this.dataSource.query(
          `SELECT c.id, c.tipo, c.titulo, c.mensagem, c.versao_simplificada simplificada,
                  c.enviado_em enviadoEm, p.nome_completo professor, cl.lido_em lidoEm
             FROM comunicado c
             LEFT JOIN professor p ON p.id = c.professor_id
             LEFT JOIN comunicado_leitura cl ON cl.comunicado_id = c.id AND cl.responsavel_id = ?
            WHERE c.turma_id = ? AND c.rascunho = 0 AND c.enviado_em IS NOT NULL
            ORDER BY c.enviado_em DESC LIMIT 50`,
          [resp.id, filho.turmaId],
        )
      : [];

    return {
      data: {
        filho,
        avisos: avisos.map((a) => ({
          id: Number(a.id),
          tipo: a.tipo,
          titulo: a.titulo,
          mensagem: htmlParaTexto(a.mensagem),
          mensagemHtml: limparHtml(a.mensagem),
          simplificada: a.simplificada,
          enviadoEm: a.enviadoEm,
          autor: a.professor ?? 'Coordenação',
          lido: a.lidoEm !== null,
        })),
        resumoSemanal: await this.resumoDoFilho(alunoId, filho.primeiroNome),
      },
    };
  }

  async marcarAvisoLido(usuarioId: number, comunicadoId: number) {
    const resp = await this.responsavel(usuarioId);
    const turmas = (await this.filhos(resp.id))
      .map((f) => f.turmaId)
      .filter((t): t is number => t !== null);
    const [aviso]: { id: number }[] = turmas.length
      ? await this.dataSource.query(
          `SELECT id FROM comunicado WHERE id = ? AND turma_id IN (?)
              AND rascunho = 0 AND enviado_em IS NOT NULL`,
          [comunicadoId, turmas],
        )
      : [];
    if (!aviso) throw new NotFoundException('Aviso nao encontrado');
    await this.dataSource.query(
      'INSERT IGNORE INTO comunicado_leitura (comunicado_id, responsavel_id) VALUES (?, ?)',
      [comunicadoId, resp.id],
    );
    return { data: true };
  }

  /**
   * Resumo da semana de cada filho, para o e-mail de domingo. Respeita a
   * preferencia "Relatorio semanal por e-mail" (ligada por padrao).
   */
  async resumosParaEmail(
    responsavelId: number,
    preferencias: unknown,
  ): Promise<{ nome: string; resumo: string }[]> {
    if (!preferenciasDe(preferencias).relatorioSemanal) return [];
    const filhos = await this.filhos(responsavelId);
    return Promise.all(
      filhos.map(async (f) => ({
        nome: f.nome,
        resumo: await this.resumoDoFilho(f.id, f.primeiroNome),
      })),
    );
  }

  private async resumoDoFilho(alunoId: number, primeiroNome: string) {
    const tarefas = await this.aluno.tarefasDoAluno(alunoId);
    const linhas = this.aluno.paraLinhas(alunoId, tarefas);
    const hoje = new Date();
    const semana = semanaDe(hoje);
    const mes = mesDe(mesAtual(hoje));
    const datas = tarefas.flatMap((t) =>
      t.concluidoEm ? [t.concluidoEm] : [],
    );
    return resumoSemanal({
      primeiroNome,
      semana: taxaConclusao(
        linhas.filter((l) => noIntervalo(l.dataEntrega, semana)),
        hoje,
      ),
      iniciouSozinho: tarefas.filter(
        (t) =>
          t.iniciouSozinho === true &&
          t.iniciadoEm &&
          noIntervalo(iso(t.iniciadoEm), semana),
      ).length,
      materias: this.porMateria(tarefas, linhas, mes, hoje),
      sequenciaAtual: sequenciaAtual(datas, hoje),
      recordeMes: maiorSequencia(datas.filter((d) => noIntervalo(iso(d), mes))),
    });
  }

  /** "Familia - Relatorios": um mes (padrao: o atual). */
  async relatorio(usuarioId: number, alunoId: number, mesPedido?: string) {
    const { filho } = await this.filho(usuarioId, alunoId);
    const atual = mesAtual();
    const meses = mesesAte(atual, 6).reverse();
    const mes = mesPedido && meses.includes(mesPedido) ? mesPedido : atual;
    const intervalo = mesDe(mes);
    const tarefas = await this.aluno.tarefasDoAluno(alunoId);
    const linhas = this.aluno.paraLinhas(alunoId, tarefas);
    const hoje = new Date();
    // No mes atual o placar e de hoje; em meses passados, o fim do mes.
    const referencia =
      mes === atual ? hoje : new Date(`${intervalo[1]}T23:59:59`);

    const doMes = linhas.filter((l) => noIntervalo(l.dataEntrega, intervalo));
    const iniciadasNoMes = tarefas.filter(
      (t) => t.iniciadoEm && noIntervalo(iso(t.iniciadoEm), intervalo),
    );
    const datasMes = tarefas.flatMap((t) =>
      t.concluidoEm && noIntervalo(iso(t.concluidoEm), intervalo)
        ? [t.concluidoEm]
        : [],
    );

    return {
      data: {
        filho,
        mes,
        rotuloMes: `${MESES[Number(mes.slice(5)) - 1]} ${mes.slice(0, 4)}`,
        meses: meses.map((m) => ({
          valor: m,
          rotulo: `${MESES[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`,
        })),
        concluidas: taxaConclusao(doMes, referencia),
        iniciouSozinho: iniciadasNoMes.filter((t) => t.iniciouSozinho === true)
          .length,
        recorde: maiorSequencia(datasMes),
        ...this.aluno.placar(tarefas, hoje),
        resumo: await this.resumoDoFilho(alunoId, filho.primeiroNome),
        porMateria: this.porMateria(tarefas, linhas, intervalo, referencia),
        iniciadasPorSemana: semanasDoMes(mes).map((s, i) => ({
          rotulo: `Sem ${i + 1}`,
          sozinho: iniciadasNoMes.filter(
            (t) =>
              t.iniciouSozinho === true && noIntervalo(iso(t.iniciadoEm!), s),
          ).length,
        })),
      },
    };
  }

  /** "Familia - Configuracoes": dados do responsavel e avisos escolhidos. */
  async salvarPerfil(usuarioId: number, dto: PerfilFamiliaDto) {
    const r = await this.responsavel(usuarioId);
    await this.dataSource.transaction(async (manager) => {
      if (dto.email !== undefined && r.usuarioId) {
        const email = dto.email.trim().toLowerCase();
        const outro = await manager
          .getRepository(Usuario)
          .findOne({ where: { email, id: Not(r.usuarioId) } });
        if (outro)
          throw new BadRequestException('Ja existe um usuario com este email');
        await manager.getRepository(Usuario).update(r.usuarioId, { email });
      }
      await manager.getRepository(Responsavel).update(r.id, {
        ...(dto.nomeCompleto !== undefined && {
          nomeCompleto: dto.nomeCompleto.trim(),
        }),
        ...(dto.telefone !== undefined && {
          telefone: dto.telefone?.trim() || null,
        }),
        ...(dto.preferencias !== undefined && {
          preferencias: {
            ...PREFERENCIAS_PADRAO,
            ...(r.preferencias ?? {}),
            ...dto.preferencias,
          },
        }),
      });
    });
    return this.contexto(usuarioId);
  }
}

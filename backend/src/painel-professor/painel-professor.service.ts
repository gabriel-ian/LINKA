import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DISCIPLINA_DA_ESCOLA } from '../disciplina/disciplina.entity';
import { TarefaService } from '../tarefa/tarefa.service';
import { TarefaAdaptada } from '../tarefa-adaptada/tarefa-adaptada.entity';
import { Aluno } from '../aluno/aluno.entity';
import { PerfilAprendizagemDto } from '../painel-escola/dto/cadastros.dto';
import { perfilParaColunas } from '../painel-escola/cadastros-escola.service';
import { AdaptacaoIaService, PerfilParaIa } from './adaptacao-ia.service';
import { AvisosFamiliaService } from '../avisos-familia/avisos-familia.service';
import { htmlParaTexto, limparHtml, temTexto } from '../comum/html';
import {
  CriarTarefaProfessorDto,
  EditarAdaptacaoDto,
  EditarTarefaProfessorDto,
  SalvarComunicadoDto,
} from './dto/professor.dto';
import {
  LinhaTarefa,
  codigoTurma,
  idade,
  iso,
  mesAtual,
  mesDe,
  noIntervalo,
  paraIso,
  semanaDe,
  situacao,
  taxaConclusao,
  taxaNoPrazo,
} from '../painel-escola/metricas';

/** Enunciado do editor sem nada perigoso; vazio ("<p></p>") nao vale. */
function descricaoLimpa(html: string): string {
  const limpo = limparHtml(html);
  if (!temTexto(limpo)) throw new BadRequestException('Escreva o enunciado');
  return limpo;
}

interface Professor {
  id: number;
  nome: string;
  escola: string;
}

interface AlunoTurma {
  id: number;
  nome: string;
  neurodivergente: boolean;
  dataNascimento: string | null;
  diagnosticos: string[];
  interesses: string[];
  dificuldades: string | null;
  pontosFortes: string | null;
}

type LinhaComDisciplina = LinhaTarefa & { disciplina: string | null };

/** Dias de folga somados a hoje: tarefas mais longe que isso ainda nao contam. */
const JANELA_PASSADO = 60;

function somarDias(data: Date, dias: number): Date {
  const d = new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

/** Semanas do mes como no Figma: 1-7, 8-14, 15-21, 22-fim. */
export function semanasDoMes(mes: string): [string, string][] {
  const [, fim] = mesDe(mes);
  const limites = ['01', '08', '15', '22'];
  return limites.map((dia, i) => [
    `${mes}-${dia}`,
    i < 3
      ? `${mes}-${String(Number(limites[i + 1]) - 1).padStart(2, '0')}`
      : fim,
  ]);
}

/**
 * Telas "Professor - ..." do Figma. O professor vem sempre do token
 * (usuarioId + escolaId) e so enxerga as turmas em que leciona.
 */
@Injectable()
export class PainelProfessorService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tarefas: TarefaService,
    private readonly ia: AdaptacaoIaService,
    private readonly avisos: AvisosFamiliaService,
  ) {}

  // ---------------------------------------------------------- contexto

  async contexto(usuarioId: number, escolaId: number) {
    const professor = await this.professor(usuarioId, escolaId);
    const [disciplinas, turmas] = await Promise.all([
      this.disciplinasDoProfessor(professor.id),
      this.turmasDoProfessor(professor.id),
    ]);

    return {
      data: {
        nome: professor.nome,
        escola: professor.escola,
        disciplinas,
        turmas,
        iaDisponivel: this.ia.disponivel,
      },
    };
  }

  /** Tela "Meu perfil": dados do professor e o que da em cada turma. */
  async perfil(usuarioId: number, escolaId: number) {
    const professor = await this.professor(usuarioId, escolaId);
    const [usuario]: { email: string; ultimoLogin: Date | null }[] =
      await this.dataSource.query(
        'SELECT email, ultimo_login ultimoLogin FROM usuario WHERE id = ?',
        [usuarioId],
      );
    const linhas: {
      id: number;
      nome: string;
      disciplina: string | null;
      alunos: number;
      nee: number;
    }[] = await this.dataSource.query(
      `SELECT t.id, t.nome, d.nome disciplina,
              (SELECT COUNT(*) FROM matricula m WHERE m.turma_id = t.id) alunos,
              (SELECT COUNT(*) FROM matricula m JOIN aluno a ON a.id = m.aluno_id
                WHERE m.turma_id = t.id AND a.neurodivergente = 1) nee
         FROM turma_professor_disciplina tpd
         JOIN turma t ON t.id = tpd.turma_id AND t.encerrada = 0
         LEFT JOIN disciplina d ON d.id = tpd.disciplina_id
        WHERE tpd.professor_id = ?
        ORDER BY t.nome, d.nome`,
      [professor.id],
    );

    const turmas = new Map<
      number,
      {
        id: number;
        nome: string;
        disciplinas: string[];
        alunos: number;
        nee: number;
      }
    >();
    for (const l of linhas) {
      const id = Number(l.id);
      const t = turmas.get(id) ?? {
        id,
        nome: l.nome,
        disciplinas: [],
        alunos: Number(l.alunos),
        nee: Number(l.nee),
      };
      if (l.disciplina && !t.disciplinas.includes(l.disciplina))
        t.disciplinas.push(l.disciplina);
      turmas.set(id, t);
    }

    return {
      data: {
        nome: professor.nome,
        email: usuario?.email ?? null,
        ultimoAcesso: usuario?.ultimoLogin ?? null,
        escola: professor.escola,
        disciplinas: (await this.disciplinasDoProfessor(professor.id)).map(
          (d: { nome: string }) => d.nome,
        ),
        turmas: [...turmas.values()],
      },
    };
  }

  // -------------------------------------------------------- visao geral

  async visao(usuarioId: number, escolaId: number, turmaId: number) {
    const professor = await this.professor(usuarioId, escolaId);
    const turma = await this.turmaDoProfessor(professor.id, turmaId);
    const hoje = new Date();
    const semana = semanaDe(hoje);

    const [alunos, linhas, [{ avisos }]] = await Promise.all([
      this.alunosDaTurma(turmaId),
      this.linhas(turmaId, professor.id, [
        iso(somarDias(hoje, -JANELA_PASSADO)),
        iso(somarDias(hoje, 30)),
      ]),
      this.dataSource.query(
        `SELECT COUNT(*) avisos FROM comunicado
          WHERE professor_id = ? AND turma_id = ? AND rascunho = 0 AND enviado_em BETWEEN ? AND ?`,
        [
          professor.id,
          turmaId,
          `${semana[0]} 00:00:00`,
          `${semana[1]} 23:59:59`,
        ],
      ),
    ]);

    const atrasos = this.atrasosPorAluno(linhas, hoje);
    const comAtraso = alunos.filter((a) => atrasos.has(a.id));

    return {
      data: {
        turma: {
          ...turma,
          totalAlunos: alunos.length,
          totalNee: alunos.filter((a) => a.neurodivergente).length,
        },
        alunosEmDia: alunos.length - comAtraso.length,
        alunosComAtraso: comAtraso.map((a) => ({
          id: a.id,
          nome: a.nome,
          neurodivergente: a.neurodivergente,
        })),
        avisosSemana: Number(avisos),
        entregasSemana: taxaConclusao(
          linhas.filter((l) => noIntervalo(l.dataEntrega, semana)),
        ),
        alunosNee: alunos
          .filter((a) => a.neurodivergente)
          .map((a) => {
            const taxa = taxaConclusao(
              linhas.filter(
                (l) => l.alunoId === a.id && noIntervalo(l.dataEntrega, semana),
              ),
            );
            const atrasadas = atrasos.get(a.id) ?? 0;
            const s = situacao(taxa);
            return {
              id: a.id,
              nome: a.nome,
              diagnostico: a.diagnosticos[0] ?? null,
              desempenhoSemana: taxa,
              situacao: atrasadas ? 'atencao' : s,
              resumo: atrasadas
                ? `${atrasadas} ${atrasadas === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}`
                : {
                    atencao: 'abaixo de 50% na semana',
                    melhorando: 'melhorando',
                    'em-dia': 'em dia com as tarefas',
                    'sem-dados': 'nenhuma entrega vencida na semana',
                  }[s],
            };
          })
          .sort(
            (a, b) =>
              (a.situacao === 'atencao' ? 0 : 1) -
              (b.situacao === 'atencao' ? 0 : 1),
          ),
        tarefasRecentes: await this.tarefasRecentes(
          professor.id,
          turmaId,
          alunos.length,
          hoje,
        ),
        // Pedido de ajuda e urgente: aparece qualquer que seja a turma aberta.
        pedidosAjuda: await this.pedidosAjuda(professor.id, {}),
      },
    };
  }

  /** "Avisar a professora" do aluno, ainda nao vistos (ultimos 7 dias). */
  private async pedidosAjuda(
    professorId: number,
    filtro: { turmaId?: number; tarefaId?: number },
  ) {
    const linhas: {
      id: number;
      passo: number | null;
      criadoEm: Date;
      alunoId: number;
      aluno: string;
      tarefaId: number;
      tarefa: string;
    }[] = await this.dataSource.query(
      `SELECT pa.id, pa.passo, pa.criado_em criadoEm, a.id alunoId,
              a.nome_completo aluno, t.id tarefaId, t.titulo tarefa
         FROM pedido_ajuda pa
         JOIN tarefa t ON t.id = pa.tarefa_id
         JOIN aluno a ON a.id = pa.aluno_id
        WHERE t.professor_id = ? AND pa.visto_em IS NULL
          AND pa.criado_em >= NOW() - INTERVAL 7 DAY
          AND (? IS NULL OR t.turma_id = ?) AND (? IS NULL OR t.id = ?)
        ORDER BY pa.criado_em DESC LIMIT 20`,
      [
        professorId,
        filtro.turmaId ?? null,
        filtro.turmaId ?? null,
        filtro.tarefaId ?? null,
        filtro.tarefaId ?? null,
      ],
    );
    return linhas;
  }

  // ------------------------------------------------------- turma/alunos

  async alunos(usuarioId: number, escolaId: number, turmaId: number) {
    const professor = await this.professor(usuarioId, escolaId);
    const turma = await this.turmaDoProfessor(professor.id, turmaId);
    const hoje = new Date();
    const semana = semanaDe(hoje);
    const mes = mesDe(mesAtual(hoje));

    const [alunos, linhas, ultimas] = await Promise.all([
      this.alunosDaTurma(turmaId),
      this.linhas(turmaId, professor.id, [
        iso(somarDias(hoje, -JANELA_PASSADO)),
        iso(somarDias(hoje, 30)),
      ]),
      this.dataSource.query(
        `SELECT ts.aluno_id alunoId, MAX(ts.concluido_em) ultima FROM tarefa_status ts
           JOIN matricula m ON m.aluno_id = ts.aluno_id AND m.turma_id = ?
          GROUP BY ts.aluno_id`,
        [turmaId],
      ),
    ]);

    const atrasos = this.atrasosPorAluno(linhas, hoje);
    const ultimaPorAluno = new Map<number, Date>(
      ultimas
        .filter((u: any) => u.ultima)
        .map((u: any) => [Number(u.alunoId), new Date(u.ultima)]),
    );

    return {
      data: {
        turma: {
          ...turma,
          disciplinas: await this.disciplinasDoProfessor(professor.id),
        },
        alunos: alunos.map((a) => {
          const daSemana = linhas.filter(
            (l) => l.alunoId === a.id && noIntervalo(l.dataEntrega, semana),
          );
          const taxaMes = taxaConclusao(
            linhas.filter(
              (l) => l.alunoId === a.id && noIntervalo(l.dataEntrega, mes),
            ),
          );
          return {
            id: a.id,
            nome: a.nome,
            idade: a.dataNascimento ? idade(a.dataNascimento) : null,
            neurodivergente: a.neurodivergente,
            diagnosticos: a.diagnosticos,
            tarefasSemana: {
              concluidas: daSemana.filter((l) => l.concluida).length,
              total: daSemana.length,
            },
            entregasMes: taxaMes,
            situacao: atrasos.has(a.id) ? 'atencao' : situacao(taxaMes),
            atrasadas: atrasos.get(a.id) ?? 0,
            ultimaAtividade: ultimaPorAluno.get(a.id) ?? null,
          };
        }),
      },
    };
  }

  /** Professor edita o perfil de aprendizagem de alunos das suas turmas. */
  async editarPerfilAluno(
    usuarioId: number,
    escolaId: number,
    alunoId: number,
    dto: PerfilAprendizagemDto,
  ) {
    const professor = await this.professor(usuarioId, escolaId);
    const [matricula] = await this.dataSource.query(
      `SELECT m.turma_id turmaId FROM matricula m
         JOIN turma_professor_disciplina tpd ON tpd.turma_id = m.turma_id AND tpd.professor_id = ?
        WHERE m.aluno_id = ? LIMIT 1`,
      [professor.id, alunoId],
    );
    if (!matricula)
      throw new NotFoundException('Aluno nao encontrado nas suas turmas');

    const colunas = perfilParaColunas(dto);
    if (Object.keys(colunas).length) {
      await this.dataSource.getRepository(Aluno).update(alunoId, colunas);
    }
    return this.aluno(usuarioId, escolaId, alunoId);
  }

  async aluno(usuarioId: number, escolaId: number, alunoId: number) {
    const professor = await this.professor(usuarioId, escolaId);
    const [matricula] = await this.dataSource.query(
      `SELECT m.turma_id turmaId FROM matricula m
         JOIN turma_professor_disciplina tpd ON tpd.turma_id = m.turma_id AND tpd.professor_id = ?
        WHERE m.aluno_id = ? LIMIT 1`,
      [professor.id, alunoId],
    );
    if (!matricula)
      throw new NotFoundException('Aluno nao encontrado nas suas turmas');

    const turmaId = Number(matricula.turmaId);
    const turma = await this.turmaDoProfessor(professor.id, turmaId);
    const aluno = (await this.alunosDaTurma(turmaId)).find(
      (a) => a.id === alunoId,
    );
    if (!aluno) throw new NotFoundException('Aluno nao encontrado');

    const hoje = new Date();
    const mes = mesDe(mesAtual(hoje));
    // Todas as disciplinas da turma, para o progresso por materia.
    const linhas = (
      await this.linhas(turmaId, null, [iso(somarDias(hoje, -90)), mes[1]])
    ).filter((l) => l.alunoId === alunoId);
    const doMes = linhas.filter((l) => noIntervalo(l.dataEntrega, mes));

    const [{ adaptadas }] = await this.dataSource.query(
      'SELECT COUNT(*) adaptadas FROM tarefa_adaptada WHERE aluno_id = ? AND criado_em BETWEEN ? AND ?',
      [alunoId, `${mes[0]} 00:00:00`, `${mes[1]} 23:59:59`],
    );

    const porMateria = new Map<string, LinhaComDisciplina[]>();
    for (const l of doMes) {
      const chave = l.disciplina ?? 'Sem disciplina';
      porMateria.set(chave, [...(porMateria.get(chave) ?? []), l]);
    }

    return {
      data: {
        id: aluno.id,
        nome: aluno.nome,
        turma,
        idade: aluno.dataNascimento ? idade(aluno.dataNascimento) : null,
        neurodivergente: aluno.neurodivergente,
        diagnosticos: aluno.diagnosticos,
        dificuldades: aluno.dificuldades,
        pontosFortes: aluno.pontosFortes,
        interesses: aluno.interesses,
        desempenhoMes: taxaConclusao(doMes),
        tarefasMes: {
          concluidas: doMes.filter((l) => l.concluida).length,
          total: doMes.length,
        },
        tarefasAdaptadasNoMes: Number(adaptadas),
        progressoPorMateria: [...porMateria].map(([disciplina, ls]) => ({
          disciplina,
          taxa: taxaConclusao(ls),
        })),
        sugestoes: await this.sugestoes(aluno, linhas),
      },
    };
  }

  // ------------------------------------------------------------ tarefas

  async criarTarefa(
    usuarioId: number,
    escolaId: number,
    dto: CriarTarefaProfessorDto,
  ) {
    const professor = await this.professor(usuarioId, escolaId);
    const turmas = [...new Set([dto.turmaId, ...(dto.outrasTurmas ?? [])])];
    // Confere todas antes de criar, para nao ficar copia pela metade.
    for (const turmaId of turmas)
      await this.turmaDoProfessor(professor.id, turmaId);
    const descricao = descricaoLimpa(dto.descricao);

    const ids: number[] = [];
    for (const turmaId of turmas) {
      const criada = await this.tarefas.create(
        {
          titulo: dto.titulo.trim(),
          descricao,
          turmaId,
          disciplinaId: dto.disciplinaId,
          data_entrega: dto.dataEntrega.slice(0, 10),
          hora_limite: dto.horaLimite,
        },
        usuarioId,
        escolaId,
      );
      ids.push(criada.data.id);
    }

    return { data: { id: ids[0], ids } };
  }

  /**
   * Ajusta a tarefa ja enviada. Se o enunciado muda, as versoes adaptadas
   * de quem ainda nao comecou saem, para gerar de novo a partir do novo texto.
   */
  async editarTarefa(
    usuarioId: number,
    escolaId: number,
    tarefaId: number,
    dto: EditarTarefaProfessorDto,
  ) {
    const professor = await this.professor(usuarioId, escolaId);
    const atual = await this.tarefaDoProfessor(professor.id, tarefaId);

    const campos: Record<string, unknown> = {};
    if (dto.titulo !== undefined) campos.titulo = dto.titulo.trim();
    if (dto.descricao !== undefined)
      campos.descricao = descricaoLimpa(dto.descricao);
    if (dto.dataEntrega !== undefined)
      campos.data_entrega = dto.dataEntrega.slice(0, 10);
    if (dto.horaLimite !== undefined)
      campos.hora_limite = dto.horaLimite || null;
    if (dto.disciplinaId !== undefined) {
      const [d]: unknown[] = await this.dataSource.query(
        `SELECT 1 FROM disciplina WHERE id = ? AND ${DISCIPLINA_DA_ESCOLA}`,
        [dto.disciplinaId, escolaId],
      );
      if (!d) throw new BadRequestException('Disciplina nao encontrada');
      campos.disciplina_id = dto.disciplinaId;
    }

    const mudouEnunciado =
      campos.descricao !== undefined && campos.descricao !== atual.descricao;
    let adaptacoesRefazer = 0;
    await this.dataSource.transaction(async (manager) => {
      // As chaves de "campos" sao fixas (acima), nunca vem do corpo.
      const colunas = Object.keys(campos);
      if (colunas.length)
        await manager.query(
          `UPDATE tarefa SET ${colunas.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
          [...Object.values(campos), tarefaId],
        );
      if (mudouEnunciado) {
        const r: { affectedRows?: number } = await manager.query(
          `DELETE ta FROM tarefa_adaptada ta
             JOIN tarefa_status ts ON ts.tarefa_id = ta.tarefa_id AND ts.aluno_id = ta.aluno_id
            WHERE ta.tarefa_id = ? AND ts.status = 'pendente'
              AND ts.iniciado_em IS NULL AND ts.passos_feitos = 0`,
          [tarefaId],
        );
        adaptacoesRefazer = r.affectedRows ?? 0;
      }
    });

    return { data: { id: tarefaId, adaptacoesRefazer } };
  }

  /** Apaga a tarefa e tudo ligado a ela (status, adaptacoes, pedidos). */
  async excluirTarefa(usuarioId: number, escolaId: number, tarefaId: number) {
    const professor = await this.professor(usuarioId, escolaId);
    await this.tarefaDoProfessor(professor.id, tarefaId);
    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        'UPDATE incentivo SET tarefa_id = NULL WHERE tarefa_id = ?',
        [tarefaId],
      );
      for (const tabela of ['pedido_ajuda', 'tarefa_adaptada', 'tarefa_status'])
        await manager.query(`DELETE FROM ${tabela} WHERE tarefa_id = ?`, [
          tarefaId,
        ]);
      await manager.query('DELETE FROM tarefa WHERE id = ?', [tarefaId]);
    });
    return { data: true };
  }

  /** Envia a mesma tarefa (texto, materia e prazo) para outras turmas. */
  async copiarTarefa(
    usuarioId: number,
    escolaId: number,
    tarefaId: number,
    turmaIds: number[],
  ) {
    const professor = await this.professor(usuarioId, escolaId);
    const t = await this.tarefaDoProfessor(professor.id, tarefaId);
    const destinos = [...new Set(turmaIds)].filter((id) => id !== t.turmaId);
    if (!destinos.length)
      throw new BadRequestException('Escolha outra turma para copiar');
    for (const turmaId of destinos)
      await this.turmaDoProfessor(professor.id, turmaId);

    const ids: number[] = [];
    for (const turmaId of destinos) {
      const criada = await this.tarefas.create(
        {
          titulo: t.titulo,
          descricao: t.descricao ?? undefined,
          turmaId,
          disciplinaId: t.disciplinaId!,
          data_entrega: t.dataEntrega ?? undefined,
          hora_limite: t.horaLimite ?? undefined,
        },
        usuarioId,
        escolaId,
      );
      ids.push(criada.data.id);
    }
    return { data: { ids } };
  }

  /** Todas as tarefas do professor (opcionalmente de uma turma). */
  async listarTarefas(usuarioId: number, escolaId: number, turmaId?: number) {
    const professor = await this.professor(usuarioId, escolaId);
    const turmas = turmaId
      ? [await this.turmaDoProfessor(professor.id, turmaId)]
      : await this.turmasDoProfessor(professor.id);

    return {
      data: await this.consultarTarefas(
        professor.id,
        turmas.map((t: { id: number }) => t.id),
        new Date(),
      ),
    };
  }

  async tarefa(usuarioId: number, escolaId: number, tarefaId: number) {
    const professor = await this.professor(usuarioId, escolaId);
    const tarefa = await this.tarefaDoProfessor(professor.id, tarefaId);
    const alunos = await this.alunosDaTurma(tarefa.turmaId);
    const adaptacoes: TarefaAdaptada[] = await this.dataSource
      .getRepository(TarefaAdaptada)
      .find({ where: { tarefaId } });
    const status: {
      alunoId: number;
      status: string;
      passosFeitos: number;
      concluidoEm: Date | null;
      resposta: string | null;
      respostaEm: Date | null;
    }[] = await this.dataSource.query(
      `SELECT aluno_id alunoId, status, passos_feitos passosFeitos,
              concluido_em concluidoEm, resposta, resposta_em respostaEm
         FROM tarefa_status WHERE tarefa_id = ?`,
      [tarefaId],
    );

    // Abrir a tarefa marca os pedidos de ajuda dela como vistos.
    const pedidosAjuda = await this.pedidosAjuda(professor.id, { tarefaId });
    if (pedidosAjuda.length)
      await this.dataSource.query(
        'UPDATE pedido_ajuda SET visto_em = NOW() WHERE tarefa_id = ? AND visto_em IS NULL',
        [tarefaId],
      );

    return {
      data: {
        ...tarefa,
        descricao: tarefa.descricao ? limparHtml(tarefa.descricao) : null,
        pedidosAjuda,
        /** Como cada aluno esta na tarefa, com a resposta entregue. */
        entregas: alunos.map((a) => {
          const s = status.find((x) => Number(x.alunoId) === a.id);
          return {
            alunoId: a.id,
            nome: a.nome,
            situacao:
              s?.status === 'concluida'
                ? 'concluida'
                : s && Number(s.passosFeitos) > 0
                  ? 'em-andamento'
                  : 'pendente',
            concluidoEm: s?.concluidoEm ?? null,
            resposta: s?.resposta ?? null,
            respostaEm: s?.respostaEm ?? null,
          };
        }),
        totalAlunos: alunos.length,
        iaDisponivel: this.ia.disponivel,
        adaptacoes: alunos
          .filter((a) => a.neurodivergente)
          .map((a) => {
            const ad = adaptacoes.find((x) => x.alunoId === a.id);
            return {
              alunoId: a.id,
              nome: a.nome,
              diagnostico: a.diagnosticos[0] ?? null,
              passos: ad?.passos ?? null,
              recursos: ad?.recursos ?? [],
              geradoPorIa: ad ? !!ad.gerado_por_ia : false,
            };
          }),
      },
    };
  }

  /** Gera (ou refaz, para um aluno) as versoes adaptadas com a IA. */
  async adaptar(
    usuarioId: number,
    escolaId: number,
    tarefaId: number,
    refazerAlunoId?: number,
  ) {
    const professor = await this.professor(usuarioId, escolaId);
    const tarefa = await this.tarefaDoProfessor(professor.id, tarefaId);
    const repo = this.dataSource.getRepository(TarefaAdaptada);
    const existentes = await repo.find({ where: { tarefaId } });

    const alvos = (await this.alunosDaTurma(tarefa.turmaId)).filter(
      (a) =>
        a.neurodivergente &&
        (refazerAlunoId
          ? a.id === refazerAlunoId
          : !existentes.some((e) => e.alunoId === a.id && e.passos?.length)),
    );

    if (alvos.length) {
      const perfis: PerfilParaIa[] = alvos.map((a) => ({
        alunoId: a.id,
        primeiroNome: a.nome.split(' ')[0],
        idade: a.dataNascimento ? idade(a.dataNascimento) : null,
        diagnosticos: a.diagnosticos,
        interesses: a.interesses,
        dificuldades: a.dificuldades,
      }));

      const geradas = await this.ia.adaptarTarefa(
        {
          titulo: tarefa.titulo,
          disciplina: tarefa.disciplina,
          enunciado: htmlParaTexto(tarefa.descricao) || tarefa.titulo,
        },
        perfis,
      );

      for (const g of geradas) {
        const atual = existentes.find((e) => e.alunoId === g.alunoId);
        await repo.save({
          ...(atual ?? { tarefaId, alunoId: g.alunoId }),
          passos: g.passos,
          recursos: g.recursos,
          materiais: g.materiais,
          descricao_adaptada: g.passos
            .map((p, i) => `${i + 1}. ${p}`)
            .join('\n'),
          gerado_por_ia: true,
          atualizadoEm: atual ? new Date() : null,
        });
      }
    }

    return this.tarefa(usuarioId, escolaId, tarefaId);
  }

  async editarAdaptacao(
    usuarioId: number,
    escolaId: number,
    tarefaId: number,
    alunoId: number,
    dto: EditarAdaptacaoDto,
  ) {
    const professor = await this.professor(usuarioId, escolaId);
    const tarefa = await this.tarefaDoProfessor(professor.id, tarefaId);
    const aluno = (await this.alunosDaTurma(tarefa.turmaId)).find(
      (a) => a.id === alunoId,
    );
    if (!aluno) throw new NotFoundException('Aluno nao esta nesta turma');

    const repo = this.dataSource.getRepository(TarefaAdaptada);
    const atual = await repo.findOne({ where: { tarefaId, alunoId } });
    const passos = dto.passos.map((p) => p.trim()).filter(Boolean);

    await repo.save({
      ...(atual ?? { tarefaId, alunoId, recursos: [] }),
      passos,
      descricao_adaptada: passos.map((p, i) => `${i + 1}. ${p}`).join('\n'),
      gerado_por_ia: false,
      atualizadoEm: new Date(),
    });

    return this.tarefa(usuarioId, escolaId, tarefaId);
  }

  // -------------------------------------------------------- comunicados

  async comunicados(usuarioId: number, escolaId: number) {
    const professor = await this.professor(usuarioId, escolaId);
    const semana = semanaDe(new Date());

    const lista: any[] = await this.dataSource.query(
      `SELECT c.id, c.turma_id turmaId, t.nome turma, c.tipo, c.titulo, c.mensagem,
              c.versao_simplificada versaoSimplificada, c.rascunho, c.enviado_em enviadoEm, c.criado_em criadoEm,
              (SELECT COUNT(*) FROM comunicado_leitura cl WHERE cl.comunicado_id = c.id) leituras,
              (SELECT COUNT(DISTINCT ar.responsavel_id) FROM matricula m
                 JOIN aluno_responsavel ar ON ar.aluno_id = m.aluno_id
                WHERE m.turma_id = c.turma_id) familias
         FROM comunicado c JOIN turma t ON t.id = c.turma_id
        WHERE c.professor_id = ?
        ORDER BY COALESCE(c.enviado_em, c.criado_em) DESC
        LIMIT 30`,
      [professor.id],
    );

    const formatados = lista.map((c) => ({
      id: Number(c.id),
      turmaId: Number(c.turmaId),
      turma: c.turma,
      tipo: c.tipo,
      titulo: c.titulo,
      mensagem: limparHtml(c.mensagem),
      texto: htmlParaTexto(c.mensagem),
      versaoSimplificada: c.versaoSimplificada,
      enviadoEm: c.enviadoEm,
      criadoEm: c.criadoEm,
      leituras: Number(c.leituras),
      familias: Number(c.familias),
      rascunho: !!Number(c.rascunho),
    }));

    return {
      data: {
        enviados: formatados.filter((c) => !c.rascunho),
        rascunhos: formatados.filter((c) => c.rascunho),
        enviadosSemana: formatados.filter(
          (c) =>
            !c.rascunho &&
            c.enviadoEm &&
            noIntervalo(iso(new Date(c.enviadoEm)), semana),
        ).length,
      },
    };
  }

  async salvarComunicado(
    usuarioId: number,
    escolaId: number,
    dto: SalvarComunicadoDto,
  ) {
    const professor = await this.professor(usuarioId, escolaId);
    const turma = await this.turmaDoProfessor(professor.id, dto.turmaId);

    if (dto.id) {
      const [rascunho] = await this.dataSource.query(
        'SELECT id FROM comunicado WHERE id = ? AND professor_id = ? AND rascunho = 1',
        [dto.id, professor.id],
      );
      if (!rascunho) throw new BadRequestException('Rascunho nao encontrado');
    }

    const mensagem = limparHtml(dto.mensagem);
    if (!temTexto(mensagem))
      throw new BadRequestException('Escreva a mensagem');

    let versaoSimplificada: string | null = null;
    let avisoIa: string | null = null;
    if (dto.simplificada && !dto.rascunho) {
      if (this.ia.disponivel) {
        try {
          versaoSimplificada = await this.ia.simplificarComunicado(
            dto.titulo,
            htmlParaTexto(mensagem),
          );
        } catch {
          avisoIa =
            'A versão simplificada não pôde ser gerada agora; o aviso foi enviado no formato original.';
        }
      } else {
        avisoIa =
          'A IA não está configurada; o aviso foi enviado no formato original.';
      }
    }

    const valores = [
      dto.turmaId,
      dto.tipo,
      dto.titulo.trim(),
      mensagem,
      versaoSimplificada,
      dto.rascunho ? 1 : 0,
      dto.rascunho ? null : new Date(),
    ];

    let id = dto.id;
    if (id) {
      await this.dataSource.query(
        `UPDATE comunicado SET turma_id = ?, tipo = ?, titulo = ?, mensagem = ?, versao_simplificada = ?,
                rascunho = ?, enviado_em = ? WHERE id = ?`,
        [...valores, id],
      );
    } else {
      const resultado = await this.dataSource.query(
        `INSERT INTO comunicado (turma_id, tipo, titulo, mensagem, versao_simplificada, rascunho, enviado_em,
                                 escola_id, professor_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [...valores, escolaId, professor.id],
      );
      id = Number(resultado.insertId);
    }

    if (!dto.rascunho) this.avisos.comunicado(id);

    const alunos = await this.alunosDaTurma(dto.turmaId);
    const [{ familias }] = await this.dataSource.query(
      `SELECT COUNT(DISTINCT ar.responsavel_id) familias FROM matricula m
         JOIN aluno_responsavel ar ON ar.aluno_id = m.aluno_id WHERE m.turma_id = ?`,
      [dto.turmaId],
    );

    return {
      data: {
        id,
        turma: turma.nome,
        enviado: !dto.rascunho,
        familias: Number(familias),
        alunosNee: alunos.filter((a) => a.neurodivergente).length,
        versaoSimplificada,
        avisoIa,
      },
    };
  }

  // ---------------------------------------------------------- relatorio

  async relatorio(
    usuarioId: number,
    escolaId: number,
    filtros: { turmaId: number; mes?: string; apenasNee?: boolean },
  ) {
    const professor = await this.professor(usuarioId, escolaId);
    const turma = await this.turmaDoProfessor(professor.id, filtros.turmaId);
    const mes = filtros.mes ?? mesAtual();
    const intervalo = mesDe(mes);

    const alunos = await this.alunosDaTurma(filtros.turmaId);
    const nee = alunos.filter((a) => a.neurodivergente);
    const idsFiltro = new Set(
      (filtros.apenasNee ? nee : alunos).map((a) => a.id),
    );

    const todas = await this.linhas(filtros.turmaId, professor.id, intervalo);
    const linhas = todas.filter((l) => idsFiltro.has(l.alunoId));
    const semanas = semanasDoMes(mes);

    const [[{ criadas }], [{ adaptacoes }]] = await Promise.all([
      this.dataSource.query(
        'SELECT COUNT(*) criadas FROM tarefa WHERE professor_id = ? AND turma_id = ? AND criado_em BETWEEN ? AND ?',
        [
          professor.id,
          filtros.turmaId,
          `${intervalo[0]} 00:00:00`,
          `${intervalo[1]} 23:59:59`,
        ],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) adaptacoes FROM tarefa_adaptada ta JOIN tarefa t ON t.id = ta.tarefa_id
          WHERE t.professor_id = ? AND t.turma_id = ? AND ta.gerado_por_ia = 1 AND ta.criado_em BETWEEN ? AND ?`,
        [
          professor.id,
          filtros.turmaId,
          `${intervalo[0]} 00:00:00`,
          `${intervalo[1]} 23:59:59`,
        ],
      ),
    ]);

    const evolucaoNee = nee.map((a) => {
      const doAluno = todas.filter((l) => l.alunoId === a.id);
      const porSemana = semanas
        .map((s) =>
          taxaConclusao(doAluno.filter((l) => noIntervalo(l.dataEntrega, s))),
        )
        .filter((t): t is number => t !== null);
      return {
        id: a.id,
        nome: a.nome,
        diagnostico: a.diagnosticos[0] ?? null,
        taxa: taxaConclusao(doAluno),
        variacao:
          porSemana.length >= 2
            ? porSemana[porSemana.length - 1] - porSemana[porSemana.length - 2]
            : null,
      };
    });

    const neeLinhas = todas.filter((l) => nee.some((a) => a.id === l.alunoId));
    const tarde = neeLinhas.filter(
      (l) => l.horaLimite && l.horaLimite >= '12:00',
    );
    const manha = neeLinhas.filter(
      (l) => l.horaLimite && l.horaLimite < '12:00',
    );
    const taxaTarde =
      new Set(tarde.map((l) => l.tarefaId)).size >= 2
        ? taxaConclusao(tarde)
        : null;
    const taxaManha =
      new Set(manha.map((l) => l.tarefaId)).size >= 2
        ? taxaConclusao(manha)
        : null;

    let sugestao: string | null = null;
    if (
      taxaTarde !== null &&
      taxaManha !== null &&
      Math.abs(taxaTarde - taxaManha) >= 10
    ) {
      const melhor = taxaTarde > taxaManha ? 'à tarde' : 'pela manhã';
      sugestao = `Tarefas com prazo ${melhor} têm ${Math.abs(taxaTarde - taxaManha)} pontos a mais de entregas entre os alunos NEE.`;
    }

    return {
      data: {
        turma,
        mes,
        entregasNoPrazo: taxaNoPrazo(linhas),
        neeEmDia: nee.length
          ? Math.round(
              (evolucaoNee.filter((e) => situacao(e.taxa) === 'em-dia').length /
                nee.length) *
                100,
            )
          : null,
        tarefasCriadas: Number(criadas),
        adaptacoesIa: Number(adaptacoes),
        evolucaoNee,
        entregasPorSemana: semanas.map((s, i) => ({
          rotulo: `Sem ${i + 1}`,
          taxa: taxaConclusao(
            linhas.filter((l) => noIntervalo(l.dataEntrega, s)),
          ),
        })),
        sugestao,
      },
    };
  }

  // ------------------------------------------------------------ internos

  private async professor(
    usuarioId: number,
    escolaId: number,
  ): Promise<Professor> {
    const [p] = await this.dataSource.query(
      `SELECT p.id, p.nome_completo nome, e.nome escola FROM professor p
         JOIN escola e ON e.id = p.escola_id
        WHERE p.usuario_id = ? AND p.escola_id = ?`,
      [usuarioId, escolaId],
    );
    if (!p)
      throw new ForbiddenException(
        'Usuario nao esta vinculado a um professor desta escola',
      );
    return { id: Number(p.id), nome: p.nome ?? 'Professor', escola: p.escola };
  }

  private async disciplinasDoProfessor(professorId: number) {
    const linhas = await this.dataSource.query(
      `SELECT d.id, d.nome FROM professor_disciplina pd JOIN disciplina d ON d.id = pd.disciplina_id
        WHERE pd.professor_id = ? ORDER BY d.nome`,
      [professorId],
    );
    return linhas.map((d: any) => ({
      id: Number(d.id),
      nome: d.nome as string,
    }));
  }

  private async turmasDoProfessor(professorId: number) {
    const linhas = await this.dataSource.query(
      `SELECT DISTINCT t.id, t.nome, t.serie, t.letra FROM turma_professor_disciplina tpd
         JOIN turma t ON t.id = tpd.turma_id AND t.encerrada = 0
        WHERE tpd.professor_id = ? ORDER BY t.serie, t.letra, t.nome`,
      [professorId],
    );
    return linhas.map((t: any) => ({
      id: Number(t.id),
      nome: (t.nome as string) ?? 'Turma',
      codigo: codigoTurma(t.serie, t.letra, t.nome),
    }));
  }

  private async turmaDoProfessor(professorId: number, turmaId: number) {
    const turma = (await this.turmasDoProfessor(professorId)).find(
      (t: { id: number }) => t.id === turmaId,
    );
    if (!turma)
      throw new NotFoundException('Turma nao encontrada entre as suas');
    return turma as { id: number; nome: string; codigo: string };
  }

  private async tarefaDoProfessor(professorId: number, tarefaId: number) {
    const [t] = await this.dataSource.query(
      `SELECT t.id, t.titulo, t.descricao, t.data_entrega dataEntrega, t.hora_limite horaLimite,
              t.turma_id turmaId, tu.nome turma, t.disciplina_id disciplinaId,
              d.nome disciplina
         FROM tarefa t JOIN turma tu ON tu.id = t.turma_id
         LEFT JOIN disciplina d ON d.id = t.disciplina_id
        WHERE t.id = ? AND t.professor_id = ?`,
      [tarefaId, professorId],
    );
    if (!t) throw new NotFoundException('Tarefa nao encontrada');
    return {
      id: Number(t.id),
      titulo: t.titulo as string,
      descricao: t.descricao as string | null,
      dataEntrega: t.dataEntrega ? paraIso(t.dataEntrega) : null,
      horaLimite: t.horaLimite ? String(t.horaLimite).slice(0, 5) : null,
      turmaId: Number(t.turmaId),
      turma: t.turma as string,
      disciplinaId: t.disciplinaId ? Number(t.disciplinaId) : null,
      disciplina: t.disciplina as string | null,
    };
  }

  private async alunosDaTurma(turmaId: number): Promise<AlunoTurma[]> {
    const [alunos, diagnosticos] = await Promise.all([
      this.dataSource.query(
        `SELECT a.id, a.nome_completo nome, a.neurodivergente, a.data_nascimento dataNascimento,
                a.interesses, a.dificuldades, a.pontos_fortes pontosFortes
           FROM matricula m JOIN aluno a ON a.id = m.aluno_id
          WHERE m.turma_id = ? AND a.ativo = 1 ORDER BY a.nome_completo`,
        [turmaId],
      ),
      this.dataSource.query(
        `SELECT an.aluno_id alunoId, n.nome FROM aluno_neurodivergencia an
           JOIN neurodivergencia n ON n.id = an.neurodivergencia_id
           JOIN matricula m ON m.aluno_id = an.aluno_id
          WHERE m.turma_id = ? ORDER BY n.id`,
        [turmaId],
      ),
    ]);

    return alunos.map((a: any) => ({
      id: Number(a.id),
      nome: a.nome,
      neurodivergente: !!Number(a.neurodivergente),
      dataNascimento: a.dataNascimento ? paraIso(a.dataNascimento) : null,
      diagnosticos: diagnosticos
        .filter((d: any) => Number(d.alunoId) === Number(a.id))
        .map((d: any) => d.nome),
      interesses: (a.interesses ?? '')
        .split(',')
        .map((i: string) => i.trim())
        .filter(Boolean),
      dificuldades: a.dificuldades,
      pontosFortes: a.pontosFortes,
    }));
  }

  /** Tarefa x aluno da turma; professorId null = todas as disciplinas. */
  private async linhas(
    turmaId: number,
    professorId: number | null,
    intervalo: [string, string],
  ): Promise<LinhaComDisciplina[]> {
    const linhas = await this.dataSource.query(
      `SELECT m.aluno_id alunoId, t.id tarefaId, t.turma_id turmaId, t.data_entrega dataEntrega,
              t.hora_limite horaLimite, d.nome disciplina, ts.status, ts.concluido_em concluidoEm
         FROM tarefa t
         JOIN matricula m ON m.turma_id = t.turma_id
         JOIN aluno a ON a.id = m.aluno_id AND a.ativo = 1
         LEFT JOIN disciplina d ON d.id = t.disciplina_id
         LEFT JOIN tarefa_status ts ON ts.aluno_id = m.aluno_id AND ts.tarefa_id = t.id
        WHERE t.turma_id = ? AND (? IS NULL OR t.professor_id = ?) AND t.data_entrega BETWEEN ? AND ?`,
      [turmaId, professorId, professorId, intervalo[0], intervalo[1]],
    );

    return linhas.map((l: any) => ({
      alunoId: Number(l.alunoId),
      tarefaId: Number(l.tarefaId),
      turmaId: Number(l.turmaId),
      dataEntrega: paraIso(l.dataEntrega),
      horaLimite: l.horaLimite ? String(l.horaLimite).slice(0, 5) : null,
      disciplina: l.disciplina ?? null,
      concluida: l.status === 'concluida',
      concluidoEm: l.concluidoEm ? new Date(l.concluidoEm) : null,
    }));
  }

  /** Tarefas com prazo vencido e nao concluidas, por aluno. */
  private atrasosPorAluno(
    linhas: LinhaTarefa[],
    hoje: Date,
  ): Map<number, number> {
    const agora = hoje.getTime();
    const atrasos = new Map<number, number>();
    for (const l of linhas) {
      const prazo = new Date(
        `${l.dataEntrega}T${l.horaLimite ?? '23:59'}:00`,
      ).getTime();
      if (!l.concluida && prazo < agora)
        atrasos.set(l.alunoId, (atrasos.get(l.alunoId) ?? 0) + 1);
    }
    return atrasos;
  }

  private async tarefasRecentes(
    professorId: number,
    turmaId: number,
    _totalAlunos: number,
    hoje: Date,
  ) {
    return (await this.consultarTarefas(professorId, [turmaId], hoje, 4)).map(
      ({ turmaId: _t, turma: _n, adaptadas: _a, totalNee: _e, ...t }) => t,
    );
  }

  /**
   * Tarefas do professor com entregas e status. Total de alunos e NEE sao
   * contados por turma (a mesma tarefa so existe em uma turma).
   */
  private async consultarTarefas(
    professorId: number,
    turmaIds: number[],
    hoje: Date,
    limite?: number,
  ) {
    if (!turmaIds.length) return [];

    const tarefas = await this.dataSource.query(
      `SELECT t.id, t.titulo, t.data_entrega dataEntrega, t.hora_limite horaLimite, t.turma_id turmaId,
              tu.nome turma, d.nome disciplina,
              (SELECT COUNT(*) FROM tarefa_status ts WHERE ts.tarefa_id = t.id AND ts.status = 'concluida') entregues,
              (SELECT COUNT(*) FROM tarefa_adaptada ta
                WHERE ta.tarefa_id = t.id AND JSON_LENGTH(COALESCE(ta.passos, JSON_ARRAY())) > 0) adaptadas
         FROM tarefa t JOIN turma tu ON tu.id = t.turma_id
         LEFT JOIN disciplina d ON d.id = t.disciplina_id
        WHERE t.professor_id = ? AND t.turma_id IN (?)
        ORDER BY t.data_entrega DESC, t.id DESC ${limite ? 'LIMIT ' + Number(limite) : ''}`,
      [professorId, turmaIds],
    );

    const totais: { turmaId: number; total: string; nee: string }[] =
      await this.dataSource.query(
        `SELECT m.turma_id turmaId, COUNT(*) total, SUM(a.neurodivergente = 1) nee
         FROM matricula m JOIN aluno a ON a.id = m.aluno_id AND a.ativo = 1
        WHERE m.turma_id IN (?) GROUP BY m.turma_id`,
        [turmaIds],
      );
    const porTurma = new Map(
      totais.map((x) => [
        Number(x.turmaId),
        { total: Number(x.total), nee: Number(x.nee ?? 0) },
      ]),
    );

    const hojeIso = iso(hoje);
    const amanha = iso(somarDias(hoje, 1));

    return tarefas.map((t: any) => {
      const data = t.dataEntrega ? paraIso(t.dataEntrega) : null;
      const entregues = Number(t.entregues);
      const { total, nee } = porTurma.get(Number(t.turmaId)) ?? {
        total: 0,
        nee: 0,
      };
      const status =
        total > 0 && entregues >= total
          ? 'concluida'
          : data === hojeIso
            ? 'hoje'
            : data === amanha
              ? 'amanha'
              : data && data < hojeIso
                ? 'encerrada'
                : 'futura';
      return {
        id: Number(t.id),
        titulo: t.titulo as string,
        disciplina: t.disciplina as string | null,
        turmaId: Number(t.turmaId),
        turma: t.turma as string,
        dataEntrega: data,
        horaLimite: t.horaLimite ? String(t.horaLimite).slice(0, 5) : null,
        entregues,
        total,
        totalNee: nee,
        adaptadas: Number(t.adaptadas),
        status,
      };
    });
  }

  /** Sugestoes calculadas do historico do aluno (sem IA). */
  private async sugestoes(aluno: AlunoTurma, linhas: LinhaComDisciplina[]) {
    const sugestoes: {
      tipo: 'horario' | 'adaptacao' | 'atraso' | 'materia';
      texto: string;
    }[] = [];
    const nome = aluno.nome.split(' ')[0];

    const horas = linhas
      .filter((l) => l.concluidoEm)
      .map((l) => (l.concluidoEm as Date).getHours());
    if (horas.length >= 3) {
      const faixas = [
        {
          nome: 'pela manhã (até 12 h)',
          n: horas.filter((h) => h < 12).length,
        },
        {
          nome: 'à tarde (12 h às 18 h)',
          n: horas.filter((h) => h >= 12 && h < 18).length,
        },
        {
          nome: 'à noite (depois das 18 h)',
          n: horas.filter((h) => h >= 18).length,
        },
      ].sort((a, b) => b.n - a.n);
      if (faixas[0].n / horas.length >= 0.6) {
        sugestoes.push({
          tipo: 'horario',
          texto: `${nome} costuma concluir as tarefas ${faixas[0].nome}. Prazos nesse período tendem a funcionar melhor.`,
        });
      }
    }

    const tarefasIds = [...new Set(linhas.map((l) => l.tarefaId))];
    if (tarefasIds.length) {
      const adaptadas: { tarefaId: number }[] = await this.dataSource.query(
        'SELECT tarefa_id tarefaId FROM tarefa_adaptada WHERE aluno_id = ? AND tarefa_id IN (?)',
        [aluno.id, tarefasIds],
      );
      const ids = new Set(adaptadas.map((a) => Number(a.tarefaId)));
      const com = linhas.filter((l) => ids.has(l.tarefaId));
      const sem = linhas.filter((l) => !ids.has(l.tarefaId));
      const tCom = com.length >= 2 ? taxaConclusao(com) : null;
      const tSem = sem.length >= 2 ? taxaConclusao(sem) : null;
      if (tCom !== null && tSem !== null && tCom - tSem >= 15) {
        sugestoes.push({
          tipo: 'adaptacao',
          texto: `${nome} entrega ${tCom - tSem} pontos a mais quando a tarefa vem adaptada em passos.`,
        });
      }
    }

    const porMateria = new Map<string, LinhaComDisciplina[]>();
    for (const l of linhas)
      porMateria.set(l.disciplina ?? '', [
        ...(porMateria.get(l.disciplina ?? '') ?? []),
        l,
      ]);
    const fracas = [...porMateria]
      .filter(([d, ls]) => d && ls.length >= 3)
      .map(([d, ls]) => ({ d, t: taxaConclusao(ls) ?? 0 }))
      .filter((x) => x.t < 50);
    if (fracas.length) {
      sugestoes.push({
        tipo: 'materia',
        texto: `Em ${fracas.map((f) => f.d).join(' e ')} as entregas estão abaixo de 50%. Vale conversar com ${nome} sobre essas tarefas.`,
      });
    }

    return sugestoes;
  }
}

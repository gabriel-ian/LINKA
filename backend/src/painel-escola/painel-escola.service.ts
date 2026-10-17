import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  LinhaTarefa,
  Situacao,
  codigoTurma,
  idade,
  maiorSequencia,
  mesAtual,
  mesDe,
  mesesAte,
  noIntervalo,
  paraIso,
  semanaDe,
  situacao,
  taxaConclusao,
  taxaNoPrazo,
} from './metricas';

export interface TurmaResumo {
  id: number;
  nome: string;
  codigo: string;
  serie: string | null;
  letra: string | null;
  turno: string | null;
  anoLetivo: number | null;
  sala: string | null;
  limiteAlunos: number | null;
  criadoEm: Date;
  totalAlunos: number;
  totalNee: number;
  professores: { id: number; nome: string; disciplinas: string[] }[];
  /** % de conclusao dos alunos NEE no mes atual. */
  desempenho: number | null;
}

export interface AlunoResumo {
  id: number;
  nome: string;
  cgm: string | null;
  neurodivergente: boolean;
  turma: { id: number; nome: string; codigo: string } | null;
  diagnosticos: string[];
  desempenhoSemana: number | null;
  situacao: Situacao;
}

/** Ordem de prioridade de atencao na lista de alunos. */
const PRIORIDADE: Record<Situacao, number> = {
  atencao: 0,
  melhorando: 1,
  'sem-dados': 2,
  'em-dia': 3,
};

/**
 * Leituras do painel da escola. Tudo e escopado pelo escolaId do token:
 * o service nunca confia em id de escola vindo da requisicao.
 */
@Injectable()
export class PainelEscolaService {
  constructor(private readonly dataSource: DataSource) {}

  // ---------------------------------------------------------------- opcoes

  /** Listas dos formularios: disciplinas, diagnosticos, turmas e professores. */
  async opcoes(escolaId: number) {
    const [disciplinas, diagnosticos, turmas, professores] = await Promise.all([
      this.dataSource.query('SELECT id, nome FROM disciplina ORDER BY nome'),
      this.dataSource.query(
        'SELECT id, nome FROM neurodivergencia ORDER BY id',
      ),
      this.dataSource.query(
        'SELECT id, nome, serie, letra FROM turma WHERE escola_id = ? ORDER BY serie, letra, nome',
        [escolaId],
      ),
      this.listarProfessores(escolaId),
    ]);

    return {
      data: {
        disciplinas: disciplinas.map((d: any) => ({
          id: Number(d.id),
          nome: d.nome,
        })),
        diagnosticos: diagnosticos.map((d: any) => ({
          id: Number(d.id),
          nome: d.nome,
        })),
        turmas: turmas.map((t: any) => ({
          id: Number(t.id),
          nome: t.nome ?? 'Turma sem nome',
          codigo: codigoTurma(t.serie, t.letra, t.nome),
        })),
        professores: professores.data
          .filter((p) => p.status !== 'inativo')
          .map((p) => ({ id: p.id, nome: p.nome, disciplinas: p.disciplinas })),
      },
    };
  }

  // ---------------------------------------------------------------- turmas

  async listarTurmas(escolaId: number): Promise<{ data: TurmaResumo[] }> {
    const base = await this.carregarBase(escolaId, mesDe(mesAtual()));
    return { data: base.turmas.map((t) => this.resumoTurma(t, base)) };
  }

  async detalharTurma(escolaId: number, turmaId: number) {
    const mes = mesDe(mesAtual());
    const base = await this.carregarBase(escolaId, mes);
    const turma = base.turmas.find((t) => t.id === turmaId);

    if (!turma) throw new NotFoundException('Turma nao encontrada');

    const resumo = this.resumoTurma(turma, base);
    const alunosDaTurma = base.alunos.filter(
      (a) => base.turmaDoAluno.get(a.id) === turmaId,
    );
    const linhasTurma = base.linhas.filter((l) => l.turmaId === turmaId);
    const idsNee = new Set(
      alunosDaTurma.filter((a) => a.neurodivergente).map((a) => a.id),
    );

    const [{ total: tarefasNoMes }] = await this.dataSource.query(
      'SELECT COUNT(*) total FROM tarefa WHERE turma_id = ? AND criado_em BETWEEN ? AND ?',
      [turmaId, `${mes[0]} 00:00:00`, `${mes[1]} 23:59:59`],
    );
    const [{ total: adaptadas }] = await this.dataSource.query(
      `SELECT COUNT(*) total FROM tarefa_adaptada ta JOIN tarefa t ON t.id = ta.tarefa_id
        WHERE t.turma_id = ? AND ta.criado_em BETWEEN ? AND ?`,
      [turmaId, `${mes[0]} 00:00:00`, `${mes[1]} 23:59:59`],
    );

    return {
      data: {
        ...resumo,
        entregasNoPrazo: taxaNoPrazo(
          linhasTurma.filter((l) => idsNee.has(l.alunoId)),
        ),
        tarefasNoMes: Number(tarefasNoMes),
        tarefasAdaptadasNoMes: Number(adaptadas),
        alunosNee: this.ordenarPorAtencao(
          alunosDaTurma
            .filter((a) => a.neurodivergente)
            .map((a) => this.resumoAluno(a, base)),
        ),
      },
    };
  }

  // ----------------------------------------------------------- professores

  async listarProfessores(escolaId: number) {
    const professores: {
      id: number;
      nome: string | null;
      email: string | null;
      ativo: number | null;
      ultimoLogin: Date | null;
    }[] = await this.dataSource.query(
      `SELECT p.id, p.nome_completo nome, u.email, u.ativo, u.ultimo_login ultimoLogin
         FROM professor p LEFT JOIN usuario u ON u.id = p.usuario_id
        WHERE p.escola_id = ? ORDER BY p.nome_completo`,
      [escolaId],
    );

    const disciplinas: { professorId: number; nome: string }[] =
      await this.dataSource.query(
        `SELECT pd.professor_id professorId, d.nome FROM professor_disciplina pd
         JOIN disciplina d ON d.id = pd.disciplina_id
         JOIN professor p ON p.id = pd.professor_id
        WHERE p.escola_id = ? ORDER BY d.nome`,
        [escolaId],
      );

    const alocacoes = await this.alocacoes(escolaId);

    return {
      data: professores.map((p) => {
        const turmas = new Map<number, string>();
        for (const a of alocacoes.filter(
          (x) => Number(x.professorId) === Number(p.id),
        )) {
          turmas.set(
            Number(a.turmaId),
            codigoTurma(a.serie, a.letra, a.turmaNome),
          );
        }

        return {
          id: Number(p.id),
          nome: p.nome ?? 'Sem nome',
          email: p.email,
          disciplinas: disciplinas
            .filter((d) => Number(d.professorId) === Number(p.id))
            .map((d) => d.nome),
          turmas: [...turmas].map(([id, codigo]) => ({ id, codigo })),
          status:
            p.ativo === 0 ? 'inativo' : p.ultimoLogin ? 'ativo' : 'pendente',
        };
      }),
    };
  }

  // ---------------------------------------------------------------- alunos

  async listarAlunos(escolaId: number) {
    const base = await this.carregarBase(escolaId, semanaDe(new Date()));
    return {
      data: this.ordenarPorAtencao(
        base.alunos.map((a) => this.resumoAluno(a, base)),
      ),
    };
  }

  async detalharAluno(escolaId: number, alunoId: number) {
    const mes = mesDe(mesAtual());
    const semana = semanaDe(new Date());
    const inicio = semana[0] < mes[0] ? semana[0] : mes[0];
    const fim = semana[1] > mes[1] ? semana[1] : mes[1];
    const base = await this.carregarBase(escolaId, [inicio, fim]);

    const aluno = base.alunos.find((a) => a.id === alunoId);
    if (!aluno) throw new NotFoundException('Aluno nao encontrado');

    const [extra] = await this.dataSource.query(
      `SELECT a.data_nascimento dataNascimento, a.laudo, a.laudo_enviado_em laudoEnviadoEm,
              a.dificuldades, a.pontos_fortes pontosFortes, a.interesses, u.email
         FROM aluno a LEFT JOIN usuario u ON u.id = a.usuario_id WHERE a.id = ?`,
      [alunoId],
    );

    const responsaveis: {
      id: number;
      nome: string | null;
      telefone: string | null;
      parentesco: string | null;
      email: string | null;
      ultimoLogin: Date | null;
    }[] = await this.dataSource.query(
      `SELECT r.id, r.nome_completo nome, r.telefone, r.parentesco, u.email, u.ultimo_login ultimoLogin
         FROM aluno_responsavel ar JOIN responsavel r ON r.id = ar.responsavel_id
         LEFT JOIN usuario u ON u.id = r.usuario_id
        WHERE ar.aluno_id = ?`,
      [alunoId],
    );

    const [{ total: adaptadas }] = await this.dataSource.query(
      'SELECT COUNT(*) total FROM tarefa_adaptada WHERE aluno_id = ? AND criado_em BETWEEN ? AND ?',
      [alunoId, `${mes[0]} 00:00:00`, `${mes[1]} 23:59:59`],
    );

    const linhasMes = base.linhas.filter(
      (l) => l.alunoId === alunoId && noIntervalo(l.dataEntrega, mes),
    );
    const turmaId = base.turmaDoAluno.get(alunoId);
    const professores = turmaId ? this.professoresDaTurma(turmaId, base) : [];
    const nascimento = extra.dataNascimento
      ? paraIso(extra.dataNascimento)
      : null;

    return {
      data: {
        ...this.resumoAluno(aluno, base, semana),
        dataNascimento: nascimento,
        idade: nascimento ? idade(nascimento) : null,
        email: extra.email ?? null,
        laudo: extra.laudo ? { enviadoEm: extra.laudoEnviadoEm } : null,
        dificuldades: extra.dificuldades ?? null,
        pontosFortes: extra.pontosFortes ?? null,
        interesses: (extra.interesses ?? '')
          .split(',')
          .map((i: string) => i.trim())
          .filter(Boolean),
        professores,
        responsaveis: responsaveis.map((r) => ({
          id: Number(r.id),
          nome: r.nome,
          telefone: r.telefone,
          parentesco: r.parentesco,
          email: r.email,
          acessou: !!r.ultimoLogin,
        })),
        tarefasMes: {
          concluidas: linhasMes.filter((l) => l.concluida).length,
          total: linhasMes.length,
        },
        tarefasAdaptadasNoMes: Number(adaptadas),
        maiorSequencia: maiorSequencia(
          linhasMes
            .filter((l) => l.concluidoEm)
            .map((l) => l.concluidoEm as Date),
        ),
      },
    };
  }

  // ------------------------------------------------------------ relatorio

  async relatorio(
    escolaId: number,
    filtros: { mes?: string; turmaId?: number; diagnosticoId?: number },
  ) {
    const mes = filtros.mes ?? mesAtual();
    const meses = mesesAte(mes, 5);
    const periodo: [string, string] = [mesDe(meses[0])[0], mesDe(mes)[1]];
    const base = await this.carregarBase(escolaId, periodo);

    let alunosFiltro = base.alunos;
    if (filtros.turmaId) {
      alunosFiltro = alunosFiltro.filter(
        (a) => base.turmaDoAluno.get(a.id) === filtros.turmaId,
      );
    }
    if (filtros.diagnosticoId) {
      alunosFiltro = alunosFiltro.filter((a) =>
        a.diagnosticos.some((d) => d.id === filtros.diagnosticoId),
      );
    }
    const ids = new Set(alunosFiltro.map((a) => a.id));
    const linhas = base.linhas.filter((l) => ids.has(l.alunoId));
    const doMes = linhas.filter((l) => noIntervalo(l.dataEntrega, mesDe(mes)));
    const [inicioMes, fimMes] = mesDe(mes);

    const turmasIds = filtros.turmaId
      ? [filtros.turmaId]
      : base.turmas.map((t) => t.id);
    const [{ total: tarefasCriadas }] = turmasIds.length
      ? await this.dataSource.query(
          `SELECT COUNT(*) total FROM tarefa WHERE turma_id IN (?) AND criado_em BETWEEN ? AND ?`,
          [turmasIds, `${inicioMes} 00:00:00`, `${fimMes} 23:59:59`],
        )
      : [{ total: 0 }];
    const [{ total: adaptadas }] = ids.size
      ? await this.dataSource.query(
          `SELECT COUNT(*) total FROM tarefa_adaptada
            WHERE gerado_por_ia = 1 AND aluno_id IN (?) AND criado_em BETWEEN ? AND ?`,
          [[...ids], `${inicioMes} 00:00:00`, `${fimMes} 23:59:59`],
        )
      : [{ total: 0 }];

    return {
      data: {
        mes,
        taxaConclusao: taxaConclusao(doMes),
        entregasNoPrazo: taxaNoPrazo(doMes),
        tarefasCriadas: Number(tarefasCriadas),
        tarefasAdaptadas: Number(adaptadas),
        porTurma: base.turmas
          .filter((t) => !filtros.turmaId || t.id === filtros.turmaId)
          .map((t) => ({
            id: t.id,
            nome: t.nome,
            taxa: taxaConclusao(doMes.filter((l) => l.turmaId === t.id)),
          })),
        evolucao: meses.map((m) => ({
          mes: m,
          taxa: taxaConclusao(
            linhas.filter((l) => noIntervalo(l.dataEntrega, mesDe(m))),
          ),
        })),
      },
    };
  }

  // -------------------------------------------------------------- internos

  private resumoTurma(t: TurmaBase, base: Base): TurmaResumo {
    const alunos = base.alunos.filter(
      (a) => base.turmaDoAluno.get(a.id) === t.id,
    );
    const nee = new Set(
      alunos.filter((a) => a.neurodivergente).map((a) => a.id),
    );

    return {
      ...t,
      codigo: codigoTurma(t.serie, t.letra, t.nome),
      totalAlunos: alunos.length,
      totalNee: nee.size,
      professores: this.professoresDaTurma(t.id, base),
      desempenho: taxaConclusao(
        base.linhas.filter(
          (l) =>
            l.turmaId === t.id &&
            nee.has(l.alunoId) &&
            noIntervalo(l.dataEntrega, base.intervalo),
        ),
      ),
    };
  }

  private resumoAluno(
    a: AlunoBase,
    base: Base,
    semana = semanaDe(new Date()),
  ): AlunoResumo {
    const turmaId = base.turmaDoAluno.get(a.id);
    const turma = turmaId
      ? base.turmas.find((t) => t.id === turmaId)
      : undefined;
    const taxa = taxaConclusao(
      base.linhas.filter(
        (l) => l.alunoId === a.id && noIntervalo(l.dataEntrega, semana),
      ),
    );

    return {
      id: a.id,
      nome: a.nome,
      cgm: a.cgm,
      neurodivergente: a.neurodivergente,
      turma: turma
        ? {
            id: turma.id,
            nome: turma.nome,
            codigo: codigoTurma(turma.serie, turma.letra, turma.nome),
          }
        : null,
      diagnosticos: a.diagnosticos.map((d) => d.nome),
      desempenhoSemana: taxa,
      situacao: situacao(taxa),
    };
  }

  private professoresDaTurma(turmaId: number, base: Base) {
    const porProfessor = new Map<
      number,
      { id: number; nome: string; disciplinas: string[] }
    >();

    for (const a of base.alocacoes.filter((x) => x.turmaId === turmaId)) {
      const p = porProfessor.get(a.professorId) ?? {
        id: a.professorId,
        nome: a.professorNome ?? 'Sem nome',
        disciplinas: [],
      };
      if (a.disciplina && !p.disciplinas.includes(a.disciplina))
        p.disciplinas.push(a.disciplina);
      porProfessor.set(a.professorId, p);
    }

    return [...porProfessor.values()];
  }

  private ordenarPorAtencao(alunos: AlunoResumo[]): AlunoResumo[] {
    return alunos.sort(
      (a, b) =>
        PRIORIDADE[a.situacao] - PRIORIDADE[b.situacao] ||
        (a.desempenhoSemana ?? 101) - (b.desempenhoSemana ?? 101) ||
        a.nome.localeCompare(b.nome),
    );
  }

  private alocacoes(escolaId: number): Promise<Alocacao[]> {
    return this.dataSource.query(
      `SELECT tpd.turma_id turmaId, t.nome turmaNome, t.serie, t.letra,
              p.id professorId, p.nome_completo professorNome, d.nome disciplina
         FROM turma_professor_disciplina tpd
         JOIN turma t ON t.id = tpd.turma_id
         JOIN professor p ON p.id = tpd.professor_id
         LEFT JOIN disciplina d ON d.id = tpd.disciplina_id
        WHERE t.escola_id = ? ORDER BY tpd.id`,
      [escolaId],
    );
  }

  /** Carrega numa tacada o que as telas cruzam: turmas, alunos, alocacoes e tarefas. */
  private async carregarBase(
    escolaId: number,
    intervalo: [string, string],
  ): Promise<Base> {
    const [turmas, alunos, matriculas, diagnosticos, alocacoes, linhas] =
      await Promise.all([
        this.dataSource.query(
          `SELECT id, nome, serie, letra, turno, ano_letivo anoLetivo, sala,
                limite_alunos limiteAlunos, criado_em criadoEm
           FROM turma WHERE escola_id = ? ORDER BY serie, letra, nome`,
          [escolaId],
        ),
        this.dataSource.query(
          `SELECT id, nome_completo nome, cgm, neurodivergente FROM aluno
          WHERE escola_id = ? AND ativo = 1 ORDER BY nome_completo`,
          [escolaId],
        ),
        this.dataSource.query(
          `SELECT m.aluno_id alunoId, m.turma_id turmaId FROM matricula m
           JOIN aluno a ON a.id = m.aluno_id WHERE a.escola_id = ?`,
          [escolaId],
        ),
        this.dataSource.query(
          `SELECT an.aluno_id alunoId, n.id, n.nome FROM aluno_neurodivergencia an
           JOIN neurodivergencia n ON n.id = an.neurodivergencia_id
           JOIN aluno a ON a.id = an.aluno_id WHERE a.escola_id = ? ORDER BY n.id`,
          [escolaId],
        ),
        this.alocacoes(escolaId),
        this.dataSource.query(
          `SELECT m.aluno_id alunoId, t.id tarefaId, t.turma_id turmaId, t.data_entrega dataEntrega,
                t.hora_limite horaLimite, ts.status, ts.concluido_em concluidoEm
           FROM matricula m
           JOIN aluno a ON a.id = m.aluno_id
           JOIN tarefa t ON t.turma_id = m.turma_id
           LEFT JOIN tarefa_status ts ON ts.aluno_id = m.aluno_id AND ts.tarefa_id = t.id
          WHERE a.escola_id = ? AND a.ativo = 1 AND t.data_entrega BETWEEN ? AND ?`,
          [escolaId, intervalo[0], intervalo[1]],
        ),
      ]);

    const turmaDoAluno = new Map<number, number>();
    for (const m of matriculas) {
      if (!turmaDoAluno.has(Number(m.alunoId)))
        turmaDoAluno.set(Number(m.alunoId), Number(m.turmaId));
    }

    return {
      intervalo,
      turmas: turmas.map((t: any) => ({
        ...t,
        id: Number(t.id),
        nome: t.nome ?? 'Turma sem nome',
        anoLetivo: t.anoLetivo === null ? null : Number(t.anoLetivo),
        limiteAlunos: t.limiteAlunos === null ? null : Number(t.limiteAlunos),
      })),
      alunos: alunos.map((a: any) => ({
        id: Number(a.id),
        nome: a.nome,
        cgm: a.cgm,
        neurodivergente: !!Number(a.neurodivergente),
        diagnosticos: diagnosticos
          .filter((d: any) => Number(d.alunoId) === Number(a.id))
          .map((d: any) => ({ id: Number(d.id), nome: d.nome })),
      })),
      turmaDoAluno,
      alocacoes: alocacoes.map((a) => ({
        ...a,
        turmaId: Number(a.turmaId),
        professorId: Number(a.professorId),
      })),
      linhas: linhas.map((l: any) => ({
        alunoId: Number(l.alunoId),
        tarefaId: Number(l.tarefaId),
        turmaId: Number(l.turmaId),
        dataEntrega: paraIso(l.dataEntrega),
        horaLimite: l.horaLimite ?? null,
        concluida: l.status === 'concluida',
        concluidoEm: l.concluidoEm ? new Date(l.concluidoEm) : null,
      })),
    };
  }
}

interface TurmaBase {
  id: number;
  nome: string;
  serie: string | null;
  letra: string | null;
  turno: string | null;
  anoLetivo: number | null;
  sala: string | null;
  limiteAlunos: number | null;
  criadoEm: Date;
}

interface AlunoBase {
  id: number;
  nome: string;
  cgm: string | null;
  neurodivergente: boolean;
  diagnosticos: { id: number; nome: string }[];
}

interface Alocacao {
  turmaId: number;
  turmaNome: string | null;
  serie: string | null;
  letra: string | null;
  professorId: number;
  professorNome: string | null;
  disciplina: string | null;
}

interface Base {
  intervalo: [string, string];
  turmas: TurmaBase[];
  alunos: AlunoBase[];
  turmaDoAluno: Map<number, number>;
  alocacoes: Alocacao[];
  linhas: LinhaTarefa[];
}

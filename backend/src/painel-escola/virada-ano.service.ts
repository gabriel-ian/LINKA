import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { Turma } from '../turma/turma.entity';
import { Matricula } from '../matricula/matricula.entity';
import { TurmaProfessorDisciplina } from '../turma-professor-disciplina/turma-professor-disciplina.entity';
import { TarefaStatusService } from '../tarefa-status/tarefa-status.service';
import { AcaoVirada, ViradaAnoDto } from './dto/virada.dto';

/** Ordem das series (a mesma da tela "Nova turma"). */
export const SERIES = [
  '1º Ano',
  '2º Ano',
  '3º Ano',
  '4º Ano',
  '5º Ano',
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  '1ª Série',
  '2ª Série',
  '3ª Série',
];

/** Serie seguinte; null na ultima ou numa serie fora da lista. */
export function proximaSerie(serie: string | null): string | null {
  const i = serie ? SERIES.indexOf(serie.trim()) : -1;
  return i >= 0 && i < SERIES.length - 1 ? SERIES[i + 1] : null;
}

/**
 * O que acontece com o aluno se a escola nao mudar nada: sobe de serie se
 * a escola oferece a proxima; senao (ex.: 9º ano numa escola so de
 * fundamental) sai da turma.
 */
export function acaoPadrao(
  serie: string | null,
  seriesDaEscola: Set<string>,
): AcaoVirada {
  const proxima = proximaSerie(serie);
  return proxima && seriesDaEscola.has(proxima) ? 'promover' : 'sair';
}

interface TurmaOrigem {
  id: number;
  nome: string;
  serie: string | null;
  letra: string | null;
  turno: Turma['turno'];
  sala: string | null;
  limiteAlunos: number | null;
}

const chave = (serie: string | null, letra: string | null) =>
  `${serie ?? ''}|${letra ?? ''}`;

const nomeTurma = (serie: string | null, letra: string | null) =>
  `${serie ?? ''} ${letra ?? ''}`.trim();

/**
 * Virada do ano letivo: cria as turmas do ano seguinte (espelhando as do ano
 * que termina), move cada aluno para a proxima serie (ou repete, ou sai da
 * turma) e encerra as turmas antigas, que ficam so para consulta.
 */
@Injectable()
export class ViradaAnoService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly tarefaStatus: TarefaStatusService,
  ) {}

  /** O que a virada vai fazer, para a escola conferir antes. */
  async previa(escolaId: number) {
    const origem = await this.origem(this.dataSource.manager, escolaId);
    if (!origem) return { data: null };

    const { ano, turmas, alunos, series } = origem;
    const existentes = await this.turmasDoAno(
      this.dataSource.manager,
      escolaId,
      ano + 1,
    );

    return {
      data: {
        anoOrigem: ano,
        anoDestino: ano + 1,
        turmas: turmas.map((t) => {
          const proxima = proximaSerie(t.serie);
          return {
            id: t.id,
            nome: t.nome,
            serie: t.serie,
            letra: t.letra,
            limiteAlunos: t.limiteAlunos,
            acaoPadrao: acaoPadrao(t.serie, series),
            /** Para onde vai quem sobe (null: nao ha serie seguinte). */
            destino: proxima
              ? {
                  nome: nomeTurma(proxima, t.letra),
                  jaExiste: existentes.has(chave(proxima, t.letra)),
                }
              : null,
            alunos: alunos
              .filter((a) => a.turmaId === t.id)
              .map((a) => ({ id: a.id, nome: a.nome })),
          };
        }),
      },
    };
  }

  async executar(dto: ViradaAnoDto, escolaId: number) {
    return this.dataSource.transaction(async (manager) => {
      const origem = await this.origem(manager, escolaId);
      if (!origem || origem.ano !== dto.anoOrigem) {
        throw new BadRequestException(
          'A virada ja foi feita ou o ano mudou. Recarregue a tela.',
        );
      }
      const { ano, turmas, alunos, series } = origem;
      const anoDestino = ano + 1;
      const decisoes = new Map(
        (dto.decisoes ?? []).map((d) => [d.alunoId, d.acao]),
      );
      const turmaDe = new Map(turmas.map((t) => [t.id, t]));

      // 1) Turmas do novo ano: as que ja existem e um espelho de cada turma
      //    do ano que termina (mesma serie e letra), mais as que faltarem
      //    para quem sobe de serie.
      const destino = await this.turmasDoAno(manager, escolaId, anoDestino);
      const criadas: Turma[] = [];
      const garantir = async (
        serie: string | null,
        letra: string | null,
        modelo: TurmaOrigem,
      ) => {
        const k = chave(serie, letra);
        const achada = destino.get(k);
        if (achada) return achada;
        const repo = manager.getRepository(Turma);
        const nova = await repo.save(
          repo.create({
            nome: nomeTurma(serie, letra),
            serie,
            letra,
            turno: modelo.turno,
            anoLetivo: anoDestino,
            sala: modelo.sala,
            limiteAlunos: modelo.limiteAlunos,
            escolaId,
          }),
        );
        destino.set(k, nova);
        criadas.push(nova);
        return nova;
      };
      for (const t of turmas) await garantir(t.serie, t.letra, t);

      // 2) Para onde vai cada aluno.
      const movimentos: { alunoId: number; turma: Turma | null }[] = [];
      const contagem = { promovidos: 0, retidos: 0, semTurma: 0 };
      for (const a of alunos) {
        const t = turmaDe.get(a.turmaId)!;
        const acao = decisoes.get(a.id) ?? acaoPadrao(t.serie, series);
        if (acao === 'sair') {
          movimentos.push({ alunoId: a.id, turma: null });
          contagem.semTurma++;
          continue;
        }
        const serie = acao === 'promover' ? proximaSerie(t.serie) : t.serie;
        if (!serie) {
          throw new BadRequestException(
            `${a.nome} esta no ${t.nome}, que nao tem serie seguinte. Marque "Sem turma" ou "Repetir".`,
          );
        }
        const modelo = turmas.find(
          (x) => chave(x.serie, x.letra) === chave(serie, t.letra),
        );
        movimentos.push({
          alunoId: a.id,
          turma: await garantir(serie, t.letra, modelo ?? t),
        });
        contagem[acao === 'promover' ? 'promovidos' : 'retidos']++;
      }

      // 3) Vagas: confere antes de mover qualquer aluno.
      await this.conferirVagas(manager, movimentos);

      // 4) Professores: cada turma nova recebe os da turma de mesma serie
      //    e letra do ano que termina.
      if (dto.copiarProfessores) {
        const repo = manager.getRepository(TurmaProfessorDisciplina);
        for (const nova of criadas) {
          const modelo = turmas.find(
            (x) => chave(x.serie, x.letra) === chave(nova.serie, nova.letra),
          );
          if (!modelo) continue;
          const alocacoes = await repo.find({ where: { turmaId: modelo.id } });
          if (alocacoes.length) {
            await repo.save(
              alocacoes.map((a) => ({
                turmaId: nova.id,
                professorId: a.professorId,
                disciplinaId: a.disciplinaId,
              })),
            );
          }
        }
      }

      // 5) Move os alunos e encerra as turmas do ano que terminou.
      const matriculas = manager.getRepository(Matricula);
      for (const m of movimentos) {
        await matriculas.delete({ alunoId: m.alunoId });
        await this.tarefaStatus.removerPendentesDeOutrasTurmas(
          m.alunoId,
          m.turma?.id ?? null,
          manager,
        );
        if (!m.turma) continue;
        await matriculas.save({ alunoId: m.alunoId, turmaId: m.turma.id });
        await this.tarefaStatus.seedParaAluno(m.alunoId, m.turma.id, manager);
      }
      await manager
        .getRepository(Turma)
        .update({ id: In(turmas.map((t) => t.id)) }, { encerrada: true });

      return {
        data: {
          anoDestino,
          turmasCriadas: criadas.length,
          ...contagem,
        },
      };
    });
  }

  // ---------------------------------------------------------------------

  /**
   * Ano que termina = o mais recente com turmas abertas. Devolve as turmas
   * dele, os alunos matriculados e as series que a escola oferece.
   */
  private async origem(manager: EntityManager, escolaId: number) {
    const abertas: (TurmaOrigem & { anoLetivo: number | null })[] =
      await manager.query(
        `SELECT id, nome, serie, letra, turno, sala, limite_alunos limiteAlunos,
                ano_letivo anoLetivo
           FROM turma
          WHERE escola_id = ? AND encerrada = 0 AND ano_letivo IS NOT NULL
          ORDER BY serie, letra`,
        [escolaId],
      );
    if (!abertas.length) return null;

    const ano = Math.max(...abertas.map((t) => Number(t.anoLetivo)));
    const turmas: TurmaOrigem[] = abertas
      .filter((t) => Number(t.anoLetivo) === ano)
      .map((t) => ({
        ...t,
        id: Number(t.id),
        nome: t.nome ?? nomeTurma(t.serie, t.letra),
        limiteAlunos: t.limiteAlunos === null ? null : Number(t.limiteAlunos),
      }));

    const alunos: { id: number; nome: string; turmaId: number }[] = (
      await manager.query(
        `SELECT a.id, a.nome_completo nome, m.turma_id turmaId
           FROM matricula m JOIN aluno a ON a.id = m.aluno_id AND a.ativo = 1
          WHERE m.turma_id IN (?)
          ORDER BY a.nome_completo`,
        [turmas.map((t) => t.id)],
      )
    ).map((a: { id: number; nome: string; turmaId: number }) => ({
      id: Number(a.id),
      nome: a.nome,
      turmaId: Number(a.turmaId),
    }));

    const series = new Set(
      turmas.map((t) => t.serie).filter((s): s is string => !!s),
    );
    return { ano, turmas, alunos, series };
  }

  /** Turmas abertas de um ano, por serie e letra. */
  private async turmasDoAno(
    manager: EntityManager,
    escolaId: number,
    ano: number,
  ): Promise<Map<string, Turma>> {
    const turmas = await manager.getRepository(Turma).find({
      where: { escolaId, anoLetivo: ano, encerrada: false },
    });
    return new Map(turmas.map((t) => [chave(t.serie, t.letra), t]));
  }

  /** 400 com a lista de turmas que passariam do limite de vagas. */
  private async conferirVagas(
    manager: EntityManager,
    movimentos: { alunoId: number; turma: Turma | null }[],
  ) {
    const porTurma = new Map<number, { turma: Turma; novos: number }>();
    for (const m of movimentos) {
      if (!m.turma) continue;
      const item = porTurma.get(m.turma.id) ?? { turma: m.turma, novos: 0 };
      item.novos++;
      porTurma.set(m.turma.id, item);
    }

    const estouradas: string[] = [];
    for (const { turma, novos } of porTurma.values()) {
      if (!turma.limiteAlunos) continue;
      const atuais = await manager
        .getRepository(Matricula)
        .count({ where: { turmaId: turma.id } });
      const total = atuais + novos;
      if (total > turma.limiteAlunos) {
        estouradas.push(
          `${turma.nome} ficaria com ${total} alunos (limite ${turma.limiteAlunos})`,
        );
      }
    }
    if (estouradas.length) {
      throw new BadRequestException(
        `Sem vagas: ${estouradas.join('; ')}. Aumente o limite ou mude alguns alunos.`,
      );
    }
  }
}

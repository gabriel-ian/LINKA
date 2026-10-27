import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';
import {
  ANEXO_TAMANHO_MAXIMO,
  Anexo,
  TIPOS,
  TipoAnexo,
  nomeLimpo,
  tipoDoArquivo,
} from './tarefa-anexo.service';

export const PASTA_ENTREGAS = join(process.cwd(), 'uploads', 'entregas');
export const ARQUIVOS_POR_ENTREGA = 3;

/**
 * Foto ou documento da tarefa feita, que o aluno envia (ex.: foto do caderno).
 * Mesmos tipos e conferencia dos anexos do professor. Quem chama ja conferiu
 * que a tarefa e do aluno (ou do professor, ou da familia do aluno).
 */
@Injectable()
export class EntregaArquivoService {
  constructor(private readonly dataSource: DataSource) {}

  async listar(tarefaId: number, alunoId: number): Promise<Anexo[]> {
    const linhas: {
      id: number;
      nome: string;
      tipo: TipoAnexo;
      tamanho: number;
      criadoEm: Date;
    }[] = await this.dataSource.query(
      `SELECT id, nome, tipo, tamanho, criado_em criadoEm
         FROM tarefa_entrega_arquivo WHERE tarefa_id = ? AND aluno_id = ? ORDER BY id`,
      [tarefaId, alunoId],
    );
    return linhas.map((l) => ({
      ...l,
      id: Number(l.id),
      tamanho: Number(l.tamanho),
    }));
  }

  /** Arquivos de todos os alunos de uma tarefa (tela do professor). */
  async porAluno(tarefaId: number): Promise<Map<number, Anexo[]>> {
    const linhas: {
      id: number;
      alunoId: number;
      nome: string;
      tipo: TipoAnexo;
      tamanho: number;
      criadoEm: Date;
    }[] = await this.dataSource.query(
      `SELECT id, aluno_id alunoId, nome, tipo, tamanho, criado_em criadoEm
         FROM tarefa_entrega_arquivo WHERE tarefa_id = ? ORDER BY id`,
      [tarefaId],
    );
    const mapa = new Map<number, Anexo[]>();
    for (const l of linhas) {
      const aluno = Number(l.alunoId);
      mapa.set(aluno, [
        ...(mapa.get(aluno) ?? []),
        {
          id: Number(l.id),
          nome: l.nome,
          tipo: l.tipo,
          tamanho: Number(l.tamanho),
          criadoEm: l.criadoEm,
        },
      ]);
    }
    return mapa;
  }

  async enviar(
    tarefaId: number,
    alunoId: number,
    arquivos: Express.Multer.File[] | undefined,
  ) {
    if (!arquivos?.length)
      throw new BadRequestException('Escolha uma foto ou um documento');
    const ja = (await this.listar(tarefaId, alunoId)).length;
    if (ja + arquivos.length > ARQUIVOS_POR_ENTREGA)
      throw new BadRequestException(
        `Você pode enviar até ${ARQUIVOS_POR_ENTREGA} arquivos por tarefa`,
      );

    const conferidos = arquivos.map((a) => {
      if (a.size > ANEXO_TAMANHO_MAXIMO)
        throw new BadRequestException(
          `${nomeLimpo(a.originalname)}: o limite é 10 MB`,
        );
      const tipo = tipoDoArquivo(a);
      if (!tipo)
        throw new BadRequestException(
          `${nomeLimpo(a.originalname)}: envie foto (PNG ou JPG), PDF ou Word`,
        );
      return { a, tipo };
    });

    await fs.mkdir(PASTA_ENTREGAS, { recursive: true });
    for (const { a, tipo } of conferidos) {
      const arquivo = `${tarefaId}-${alunoId}-${randomUUID()}.${tipo.tipo}`;
      await fs.writeFile(join(PASTA_ENTREGAS, arquivo), a.buffer);
      await this.dataSource.query(
        `INSERT INTO tarefa_entrega_arquivo (tarefa_id, aluno_id, nome, arquivo, tipo, tamanho)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [tarefaId, alunoId, nomeLimpo(a.originalname), arquivo, tipo.tipo, a.size],
      );
    }
    return this.listar(tarefaId, alunoId);
  }

  async remover(tarefaId: number, alunoId: number, id: number) {
    const [a]: { arquivo: string }[] = await this.dataSource.query(
      'SELECT arquivo FROM tarefa_entrega_arquivo WHERE id = ? AND tarefa_id = ? AND aluno_id = ?',
      [id, tarefaId, alunoId],
    );
    if (!a) throw new NotFoundException('Arquivo nao encontrado');
    await this.dataSource.query(
      'DELETE FROM tarefa_entrega_arquivo WHERE id = ?',
      [id],
    );
    await fs.rm(join(PASTA_ENTREGAS, a.arquivo), { force: true });
    return this.listar(tarefaId, alunoId);
  }

  async paraBaixar(tarefaId: number, alunoId: number, id: number) {
    const [a]: { nome: string; arquivo: string; tipo: TipoAnexo }[] =
      await this.dataSource.query(
        'SELECT nome, arquivo, tipo FROM tarefa_entrega_arquivo WHERE id = ? AND tarefa_id = ? AND aluno_id = ?',
        [id, tarefaId, alunoId],
      );
    if (!a) throw new NotFoundException('Arquivo nao encontrado');
    const caminho = join(PASTA_ENTREGAS, a.arquivo);
    await fs.access(caminho).catch(() => {
      throw new NotFoundException('Arquivo nao encontrado');
    });
    const tipo = TIPOS.find((t) => t.tipo === a.tipo)!;
    const ascii =
      a.nome
        .normalize('NFD')
        .replace(/[^\x20-\x7e]/g, '')
        .replace(/"/g, '') || `entrega.${a.tipo}`;
    return {
      caminho,
      mime: tipo.mime,
      disposicao: `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(a.nome)}`,
    };
  }

  /** Apaga as linhas da tarefa (na transacao de quem exclui) e devolve os arquivos. */
  async apagarDaTarefa(
    tarefaId: number,
    manager: EntityManager,
  ): Promise<string[]> {
    const linhas: { arquivo: string }[] = await manager.query(
      'SELECT arquivo FROM tarefa_entrega_arquivo WHERE tarefa_id = ?',
      [tarefaId],
    );
    await manager.query(
      'DELETE FROM tarefa_entrega_arquivo WHERE tarefa_id = ?',
      [tarefaId],
    );
    return linhas.map((l) => l.arquivo);
  }

  async apagarArquivos(arquivos: string[]) {
    for (const a of arquivos)
      await fs.rm(join(PASTA_ENTREGAS, a), { force: true });
  }
}

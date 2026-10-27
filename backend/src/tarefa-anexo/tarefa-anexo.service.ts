import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';

export const PASTA_ANEXOS = join(process.cwd(), 'uploads', 'tarefas');
export const ANEXO_TAMANHO_MAXIMO = 10 * 1024 * 1024;
export const ANEXOS_POR_TAREFA = 5;

/**
 * Tipos aceitos, conferidos pelos primeiros bytes do arquivo (nao pelo nome):
 * um .exe renomeado para .pdf e recusado.
 */
const TIPOS = [
  {
    tipo: 'pdf',
    mime: 'application/pdf',
    assinatura: [0x25, 0x50, 0x44, 0x46],
  },
  { tipo: 'png', mime: 'image/png', assinatura: [0x89, 0x50, 0x4e, 0x47] },
  { tipo: 'jpg', mime: 'image/jpeg', assinatura: [0xff, 0xd8, 0xff] },
  // Word antigo (.doc): formato OLE da Microsoft.
  {
    tipo: 'doc',
    mime: 'application/msword',
    assinatura: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
  },
  // Word novo (.docx): um zip que tem a pasta "word/".
  {
    tipo: 'docx',
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    assinatura: [0x50, 0x4b, 0x03, 0x04],
  },
] as const;

type TipoAnexo = (typeof TIPOS)[number]['tipo'];

export interface Anexo {
  id: number;
  nome: string;
  tipo: TipoAnexo;
  tamanho: number;
  criadoEm: Date;
}

function tipoDoArquivo(arquivo: Express.Multer.File) {
  const t = TIPOS.find((x) =>
    x.assinatura.every((b, i) => arquivo.buffer[i] === b),
  );
  if (t?.tipo === 'docx' && !arquivo.buffer.includes('word/')) return undefined;
  return t;
}

/** Nome para mostrar: sem pastas nem caracteres de controle. */
function nomeLimpo(nome: string): string {
  // O multer entrega o nome em latin1; acentos voltam para utf8.
  const utf8 = Buffer.from(nome, 'latin1').toString('utf8');
  const base = utf8.split(/[\\/]/).pop() ?? 'arquivo';
  return (
    base
      .replace(/[\u0000-\u001f"]/g, '')
      .trim()
      .slice(0, 200) || 'arquivo'
  );
}

/**
 * Materiais da tarefa (PDF, imagem ou Word) que o professor anexa e o aluno
 * ve ou baixa. Os arquivos ficam em uploads/tarefas (fora do git); quem chama
 * ja conferiu que a tarefa e do professor ou do aluno.
 */
@Injectable()
export class TarefaAnexoService {
  constructor(private readonly dataSource: DataSource) {}

  async listar(tarefaId: number): Promise<Anexo[]> {
    const linhas: {
      id: number;
      nome: string;
      tipo: TipoAnexo;
      tamanho: number;
      criadoEm: Date;
    }[] = await this.dataSource.query(
      `SELECT id, nome, tipo, tamanho, criado_em criadoEm
           FROM tarefa_anexo WHERE tarefa_id = ? ORDER BY id`,
      [tarefaId],
    );
    return linhas.map((l) => ({
      ...l,
      id: Number(l.id),
      tamanho: Number(l.tamanho),
    }));
  }

  async anexar(tarefaId: number, arquivos: Express.Multer.File[] | undefined) {
    if (!arquivos?.length)
      throw new BadRequestException('Escolha pelo menos um arquivo');
    const [{ total }]: { total: number }[] = await this.dataSource.query(
      'SELECT COUNT(*) total FROM tarefa_anexo WHERE tarefa_id = ?',
      [tarefaId],
    );
    if (Number(total) + arquivos.length > ANEXOS_POR_TAREFA)
      throw new BadRequestException(
        `Cada tarefa pode ter até ${ANEXOS_POR_TAREFA} arquivos`,
      );

    // Confere todos antes de gravar qualquer um.
    const conferidos = arquivos.map((a) => {
      if (a.size > ANEXO_TAMANHO_MAXIMO)
        throw new BadRequestException(
          `${nomeLimpo(a.originalname)}: o limite é 10 MB`,
        );
      const tipo = tipoDoArquivo(a);
      if (!tipo)
        throw new BadRequestException(
          `${nomeLimpo(a.originalname)}: envie PDF, imagem (PNG ou JPG) ou Word (DOC ou DOCX)`,
        );
      return { a, tipo };
    });

    await fs.mkdir(PASTA_ANEXOS, { recursive: true });
    for (const { a, tipo } of conferidos) {
      const arquivo = `${tarefaId}-${randomUUID()}.${tipo.tipo}`;
      await fs.writeFile(join(PASTA_ANEXOS, arquivo), a.buffer);
      await this.dataSource.query(
        'INSERT INTO tarefa_anexo (tarefa_id, nome, arquivo, tipo, tamanho) VALUES (?, ?, ?, ?, ?)',
        [tarefaId, nomeLimpo(a.originalname), arquivo, tipo.tipo, a.size],
      );
    }
    return this.listar(tarefaId);
  }

  async remover(tarefaId: number, anexoId: number) {
    const [a]: { arquivo: string }[] = await this.dataSource.query(
      'SELECT arquivo FROM tarefa_anexo WHERE id = ? AND tarefa_id = ?',
      [anexoId, tarefaId],
    );
    if (!a) throw new NotFoundException('Arquivo nao encontrado');
    await this.dataSource.query('DELETE FROM tarefa_anexo WHERE id = ?', [
      anexoId,
    ]);
    await fs.rm(join(PASTA_ANEXOS, a.arquivo), { force: true });
    return this.listar(tarefaId);
  }

  /** Caminho no disco, tipo e nome para o download. */
  async paraBaixar(tarefaId: number, anexoId: number) {
    const [a]: { nome: string; arquivo: string; tipo: TipoAnexo }[] =
      await this.dataSource.query(
        'SELECT nome, arquivo, tipo FROM tarefa_anexo WHERE id = ? AND tarefa_id = ?',
        [anexoId, tarefaId],
      );
    if (!a) throw new NotFoundException('Arquivo nao encontrado');
    const caminho = join(PASTA_ANEXOS, a.arquivo);
    await fs.access(caminho).catch(() => {
      throw new NotFoundException('Arquivo nao encontrado');
    });
    const tipo = TIPOS.find((t) => t.tipo === a.tipo)!;
    // Nome em ASCII para navegadores antigos e o original (com acentos) no filename*.
    const ascii =
      a.nome
        .normalize('NFD')
        .replace(/[^\x20-\x7e]/g, '')
        .replace(/"/g, '') || `anexo.${a.tipo}`;
    return {
      caminho,
      mime: tipo.mime,
      disposicao: `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(a.nome)}`,
    };
  }

  /** Copia os arquivos de uma tarefa para outra (copiar para outras turmas). */
  async copiar(deTarefaId: number, paraTarefaId: number) {
    const linhas: {
      nome: string;
      arquivo: string;
      tipo: TipoAnexo;
      tamanho: number;
    }[] = await this.dataSource.query(
      'SELECT nome, arquivo, tipo, tamanho FROM tarefa_anexo WHERE tarefa_id = ?',
      [deTarefaId],
    );
    for (const l of linhas) {
      const novo = `${paraTarefaId}-${randomUUID()}.${l.tipo}`;
      await fs
        .copyFile(join(PASTA_ANEXOS, l.arquivo), join(PASTA_ANEXOS, novo))
        .catch(() => null);
      await this.dataSource.query(
        'INSERT INTO tarefa_anexo (tarefa_id, nome, arquivo, tipo, tamanho) VALUES (?, ?, ?, ?, ?)',
        [paraTarefaId, l.nome, novo, l.tipo, l.tamanho],
      );
    }
  }

  /** Apaga as linhas (na transacao de quem exclui a tarefa) e devolve os arquivos. */
  async apagarDaTarefa(
    tarefaId: number,
    manager: EntityManager,
  ): Promise<string[]> {
    const linhas: { arquivo: string }[] = await manager.query(
      'SELECT arquivo FROM tarefa_anexo WHERE tarefa_id = ?',
      [tarefaId],
    );
    await manager.query('DELETE FROM tarefa_anexo WHERE tarefa_id = ?', [
      tarefaId,
    ]);
    return linhas.map((l) => l.arquivo);
  }

  /** Apaga os arquivos do disco (depois que a transacao confirmou). */
  async apagarArquivos(arquivos: string[]) {
    for (const a of arquivos)
      await fs.rm(join(PASTA_ANEXOS, a), { force: true });
  }
}

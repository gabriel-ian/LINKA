import { BadRequestException, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

/** Desenhos que os alunos fazem para o cartao do Inicio (um PNG por aluno). */
export const PASTA_DESENHOS = join(process.cwd(), 'uploads', 'desenhos');
export const DESENHO_TAMANHO_MAXIMO = 2 * 1024 * 1024;

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function caminhoDesenho(alunoId: number): string {
  return join(PASTA_DESENHOS, `${Number(alunoId)}.png`);
}

/** Grava o PNG do desenho (confere os bytes, nao so o nome). */
export async function gravarDesenho(
  alunoId: number,
  arquivo: Express.Multer.File | undefined,
): Promise<void> {
  if (!arquivo?.buffer?.length)
    throw new BadRequestException('Faça um desenho antes de salvar');
  if (arquivo.size > DESENHO_TAMANHO_MAXIMO)
    throw new BadRequestException('O desenho ficou grande demais');
  if (!PNG.every((b, i) => arquivo.buffer[i] === b))
    throw new BadRequestException('O desenho precisa ser uma imagem PNG');
  await fs.mkdir(PASTA_DESENHOS, { recursive: true });
  await fs.writeFile(caminhoDesenho(alunoId), arquivo.buffer);
}

export async function desenhoExiste(alunoId: number): Promise<string> {
  const caminho = caminhoDesenho(alunoId);
  await fs.access(caminho).catch(() => {
    throw new NotFoundException('Ainda nao tem desenho');
  });
  return caminho;
}

export async function apagarDesenho(alunoId: number): Promise<void> {
  await fs.rm(caminhoDesenho(alunoId), { force: true });
}

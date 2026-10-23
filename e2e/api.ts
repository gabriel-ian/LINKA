import { readFileSync } from 'fs';
import { join } from 'path';

export const API = process.env.E2E_API ?? 'http://localhost:3000';
const ARQUIVO_ESTADO = join(__dirname, '.estado.json');

/** O que o global-setup criou para os testes (escola, turma, pessoas...). */
export interface Estado {
  escola: { id: number; nome: string; email: string; senha: string };
  turma: { id: number; nome: string };
  professor: { email: string; senha: string };
  aluno: { id: number; nome: string; email: string; senha: string };
  alunoSemTurma: { id: number; nome: string };
  tarefa: { id: number; titulo: string };
  /** Aluno com familia e laudo, usado no teste de LGPD (tem os dados apagados no fim). */
  alunoComFamilia: { id: number; nome: string };
  familia: { email: string; senha: string };
  /** Aluno de OUTRA escola de teste: a escola principal nao pode ve-lo. */
  alunoDeOutraEscola: { id: number };
}

export function lerEstado(): Estado {
  return JSON.parse(readFileSync(ARQUIVO_ESTADO, 'utf8')) as Estado;
}

export { ARQUIVO_ESTADO };

/** Chamada direta a API (para preparar dados sem passar pelas telas). */
export async function api<T = unknown>(
  metodo: string,
  caminho: string,
  token?: string,
  corpo?: unknown,
): Promise<T> {
  const r = await fetch(API + caminho, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${metodo} ${caminho} -> ${r.status}: ${texto}`);
  return (texto ? JSON.parse(texto) : null) as T;
}

export async function entrar(email: string, senha: string): Promise<string> {
  const r = await api<{ access_token: string }>(
    'POST',
    '/auth/login',
    undefined,
    {
      email,
      senha,
    },
  );
  return r.access_token;
}

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@linka.com',
  senha: process.env.E2E_ADMIN_SENHA ?? 'linka123',
};

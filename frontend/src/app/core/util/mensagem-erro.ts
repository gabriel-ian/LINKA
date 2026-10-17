import { HttpErrorResponse } from '@angular/common/http';

/** Mensagens do backend (sem acento) -> texto para a tela. */
const TRADUCOES: [RegExp, string | ((m: RegExpMatchArray) => string)][] = [
  [/usuario com este email/i, 'Este e-mail já está em uso.'],
  [
    /e-mail do responsavel ja e usado/i,
    'O e-mail do responsável já é usado por outro tipo de conta.',
  ],
  [/aluno com este CGM/i, 'Já existe um aluno com este CGM.'],
  [/Ja existe a turma (.+) em (\d{4})/i, (m) => `Já existe a turma ${m[1]} em ${m[2]}.`],
  [/Aluno ja matriculado/i, 'O aluno já está matriculado nesta turma.'],
  [
    /A disciplina (.+) nao esta entre as do professor/i,
    (m) => `A disciplina ${m[1]} não está entre as do professor.`,
  ],
  [/Turma repetida/i, 'A mesma turma foi escolhida duas vezes.'],
  [
    /A turma (.+) esta cheia \(limite de (\d+) alunos\)/i,
    (m) => `A turma ${m[1]} está cheia (limite de ${m[2]} alunos).`,
  ],
  [
    /A turma (.+) so tem (\d+) vaga\(s\) \(limite de (\d+) alunos\)/i,
    (m) =>
      `A turma ${m[1]} só tem ${m[2]} ${m[2] === '1' ? 'vaga' : 'vagas'} (limite de ${m[3]} alunos).`,
  ],
  [
    /A turma ja tem (\d+) alunos/i,
    (m) => `A turma já tem ${m[1]} alunos; o limite não pode ser menor.`,
  ],
  [/nao tem login na Linka/i, 'Este cadastro não tem login na Linka.'],
  [/nao tem login de acesso/i, 'Esta escola não tem login de acesso cadastrado.'],
  [/escola ja esta desativada/i, 'A escola já está desativada.'],
  [/Diagnostico invalido/i, 'Diagnóstico inválido.'],
  [/Turma invalida|Turma nao encontrada/i, 'Turma não encontrada.'],
  [/Professor invalido|Professor nao encontrado/i, 'Professor não encontrado.'],
  [/Aluno nao encontrado/i, 'Aluno não encontrado.'],
  [/Disciplina nao encontrada/i, 'Disciplina não encontrada.'],
  [/Tarefa nao encontrada/i, 'Tarefa não encontrada.'],
  [/laudo deve ser PDF/i, 'O laudo deve ser PDF, PNG ou JPG.'],
  [/laudo pode ter ate 10 MB/i, 'O laudo pode ter até 10 MB.'],
  [/Senha atual incorreta/i, 'A senha atual está incorreta.'],
  [/precisa ser diferente/i, 'A nova senha precisa ser diferente da atual.'],
  [/ANTHROPIC_API_KEY|nao configurada/i, 'A adaptação por IA ainda não foi configurada.'],
  [/IA ocupada/i, 'A IA está ocupada no momento. Tente de novo em instantes.'],
  [/IA nao conseguiu|falar com a IA/i, 'A IA não conseguiu gerar a adaptação agora.'],
];

/**
 * Texto amigavel para um erro da API. Erros de validacao do class-validator
 * (em ingles) e mensagens desconhecidas viram o texto padrao da tela.
 */
export function mensagemDeErro(e: HttpErrorResponse, padrao: string): string {
  if (e.status === 0) return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  if (e.status === 403) return 'Você não tem permissão para fazer isso.';

  const msg = [e.error?.message].flat().filter(Boolean).join(' ');
  for (const [padraoMsg, texto] of TRADUCOES) {
    const m = msg.match(padraoMsg);
    if (m) return typeof texto === 'string' ? texto : texto(m);
  }
  return padrao;
}

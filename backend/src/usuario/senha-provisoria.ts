import { randomInt } from 'crypto';

/** Sem caracteres que se confundem ao ditar (0/O, 1/l/I). */
const ALFABETO_SENHA =
  'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Senha aleatoria para a escola (ou o ADM) repassar ao usuario. */
export function gerarSenhaProvisoria(tamanho = 10): string {
  return Array.from(
    { length: tamanho },
    () => ALFABETO_SENHA[randomInt(ALFABETO_SENHA.length)],
  ).join('');
}

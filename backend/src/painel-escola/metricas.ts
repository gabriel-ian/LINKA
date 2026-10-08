/**
 * Calculos do painel da escola, sem acesso a banco (faceis de testar).
 * Toda data aqui e string 'YYYY-MM-DD' no fuso do servidor.
 */

/** Uma tarefa de um aluno (tarefa da turma + status, que pode nao existir). */
export interface LinhaTarefa {
  alunoId: number;
  tarefaId: number;
  turmaId: number;
  dataEntrega: string;
  horaLimite: string | null;
  concluida: boolean;
  concluidoEm: Date | null;
}

export type Situacao = 'atencao' | 'melhorando' | 'em-dia' | 'sem-dados';

export function iso(data: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

/** mysql2 devolve DATE como Date (meia-noite local) ou string, conforme a config. */
export function paraIso(valor: Date | string): string {
  return valor instanceof Date ? iso(valor) : String(valor).slice(0, 10);
}

/** Segunda a domingo da semana de `hoje`. */
export function semanaDe(hoje: Date): [string, string] {
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7));
  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);
  return [iso(inicio), iso(fim)];
}

/** "2026-07" -> ["2026-07-01", "2026-07-31"]. */
export function mesDe(mes: string): [string, string] {
  const [ano, m] = mes.split('-').map(Number);
  const ultimo = new Date(ano, m, 0).getDate();
  return [`${mes}-01`, `${mes}-${String(ultimo).padStart(2, '0')}`];
}

export function mesAtual(hoje = new Date()): string {
  return iso(hoje).slice(0, 7);
}

/** Os `quantos` meses que terminam em `mes`, do mais antigo ao mais novo. */
export function mesesAte(mes: string, quantos: number): string[] {
  const [ano, m] = mes.split('-').map(Number);
  return Array.from({ length: quantos }, (_, i) => {
    const d = new Date(ano, m - 1 - (quantos - 1 - i), 1);
    return iso(d).slice(0, 7);
  });
}

export function noIntervalo(
  data: string,
  [inicio, fim]: [string, string],
): boolean {
  return data >= inicio && data <= fim;
}

/** % de tarefas concluidas; null quando nao ha tarefa no periodo. */
export function taxaConclusao(linhas: LinhaTarefa[]): number | null {
  if (linhas.length === 0) return null;
  const feitas = linhas.filter((l) => l.concluida).length;
  return Math.round((feitas / linhas.length) * 100);
}

/**
 * % das tarefas ja vencidas que foram concluidas dentro do prazo
 * (data de entrega + hora limite, ou fim do dia).
 */
export function taxaNoPrazo(
  linhas: LinhaTarefa[],
  hoje = new Date(),
): number | null {
  const agora = hoje.getTime();
  const prazo = (l: LinhaTarefa) =>
    new Date(`${l.dataEntrega}T${l.horaLimite ?? '23:59:59'}`).getTime();

  const vencidas = linhas.filter((l) => prazo(l) <= agora);
  if (vencidas.length === 0) return null;

  const emDia = vencidas.filter(
    (l) => l.concluida && l.concluidoEm && l.concluidoEm.getTime() <= prazo(l),
  ).length;

  return Math.round((emDia / vencidas.length) * 100);
}

/** Faixas usadas em todo o painel (Figma: 35% atencao, 62% melhorando, 85% em dia). */
export function situacao(taxa: number | null): Situacao {
  if (taxa === null) return 'sem-dados';
  if (taxa < 50) return 'atencao';
  if (taxa < 70) return 'melhorando';
  return 'em-dia';
}

/** Maior sequencia de dias seguidos com ao menos uma tarefa concluida. */
export function maiorSequencia(datasConclusao: Date[]): number {
  const dias = [...new Set(datasConclusao.map(iso))].sort();
  let maior = 0;
  let atual = 0;
  let anterior: string | null = null;

  for (const dia of dias) {
    if (anterior) {
      const esperado = new Date(`${anterior}T12:00:00`);
      esperado.setDate(esperado.getDate() + 1);
      atual = iso(esperado) === dia ? atual + 1 : 1;
    } else {
      atual = 1;
    }
    maior = Math.max(maior, atual);
    anterior = dia;
  }

  return maior;
}

/** Idade completa em anos na data `hoje`. */
export function idade(nascimento: string, hoje = new Date()): number {
  const [a, m, d] = nascimento.split('-').map(Number);
  let anos = hoje.getFullYear() - a;
  if (
    hoje.getMonth() + 1 < m ||
    (hoje.getMonth() + 1 === m && hoje.getDate() < d)
  )
    anos--;
  return anos;
}

/** "8º Ano" + "A" -> "8A"; sem serie usa as iniciais do nome. */
export function codigoTurma(
  serie: string | null,
  letra: string | null,
  nome: string | null,
): string {
  const numero = serie?.match(/\d+/)?.[0];
  if (numero && letra) return `${numero}${letra.toUpperCase()}`;

  const texto = nome ?? '';
  const m = texto.match(/(\d+)\D*([A-Za-z])\s*$/);
  return m ? `${m[1]}${m[2].toUpperCase()}` : texto.slice(0, 3).toUpperCase();
}

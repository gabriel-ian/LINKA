/** Arquivo anexado a uma tarefa pelo professor (os alunos veem ou baixam). */
export interface Anexo {
  id: number;
  nome: string;
  tipo: 'pdf' | 'png' | 'jpg' | 'doc' | 'docx';
  /** Bytes. */
  tamanho: number;
  criadoEm: string;
}

/** Tipos que o navegador consegue mostrar (o Word so da para baixar). */
export const ANEXO_VISUALIZAVEL: Anexo['tipo'][] = ['pdf', 'png', 'jpg'];
export const ANEXO_EXTENSOES = '.pdf,.png,.jpg,.jpeg,.doc,.docx';
export const ANEXO_TAMANHO_MAXIMO = 10 * 1024 * 1024;
export const ANEXOS_POR_TAREFA = 5;

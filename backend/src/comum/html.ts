import sanitizeHtml from 'sanitize-html';

/**
 * Texto com formatacao vindo do editor (professor e aluno). Fica so o que o
 * editor produz; scripts, estilos e eventos sao removidos (evita XSS).
 */
export function limparHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'ul',
      'ol',
      'li',
      'h2',
      'h3',
      'blockquote',
      'a',
    ],
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        target: '_blank',
        rel: 'noopener noreferrer',
      }),
    },
  }).trim();
}

/**
 * O mesmo texto sem formatacao: para a IA, a leitura em voz alta, os
 * e-mails e as listas. Paragrafos e itens viram quebras de linha.
 */
export function htmlParaTexto(html: string | null | undefined): string {
  if (!html) return '';
  const comQuebras = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '\n- ')
    .replace(/<\/\s*li\s*>/gi, '')
    .replace(/<\/\s*(p|h2|h3|blockquote|ul|ol)\s*>/gi, '\n');
  return sanitizeHtml(comQuebras, { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** O texto tem conteudo depois de limpo (o editor pode mandar "<p></p>"). */
export function temTexto(html: string | null | undefined): boolean {
  return htmlParaTexto(html).length > 0;
}

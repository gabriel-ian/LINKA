import { htmlParaTexto, limparHtml, temTexto } from './html';

describe('html do editor', () => {
  it('remove scripts e eventos, mantem a formatacao', () => {
    const sujo =
      '<p onclick="x()">Oi <strong>turma</strong><script>alert(1)</script></p><img src=x onerror=y>';
    expect(limparHtml(sujo)).toBe('<p>Oi <strong>turma</strong></p>');
  });

  it('links abrem em outra aba e javascript: e bloqueado', () => {
    expect(limparHtml('<a href="https://x.com">x</a>')).toBe(
      '<a href="https://x.com" target="_blank" rel="noopener noreferrer">x</a>',
    );
    expect(limparHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      '<a target="_blank" rel="noopener noreferrer">x</a>',
    );
  });

  it('vira texto simples para a IA e a voz', () => {
    expect(
      htmlParaTexto(
        '<p>Leia a <em>página 10</em>.</p><ul><li>Ex. 1</li><li>Ex. 2</li></ul>',
      ),
    ).toBe('Leia a página 10.\n\n- Ex. 1\n- Ex. 2');
    expect(htmlParaTexto('Texto antigo sem html')).toBe(
      'Texto antigo sem html',
    );
  });

  it('editor vazio nao conta como texto', () => {
    expect(temTexto('<p></p>')).toBe(false);
    expect(temTexto('<p>&nbsp;</p>')).toBe(false);
    expect(temTexto('<p>ok</p>')).toBe(true);
  });
});

import { acaoPadrao, proximaSerie } from './virada-ano.service';

describe('virada do ano letivo', () => {
  it('proxima serie segue a ordem do fundamental ao medio', () => {
    expect(proximaSerie('6º Ano')).toBe('7º Ano');
    expect(proximaSerie('9º Ano')).toBe('1ª Série');
    expect(proximaSerie('3ª Série')).toBeNull();
    expect(proximaSerie('Turma especial')).toBeNull();
    expect(proximaSerie(null)).toBeNull();
  });

  it('sobe de serie so se a escola oferece a seguinte', () => {
    const fundamental = new Set(['6º Ano', '7º Ano', '8º Ano', '9º Ano']);
    expect(acaoPadrao('6º Ano', fundamental)).toBe('promover');
    // 9º ano numa escola so de fundamental: sai da turma (concluiu)
    expect(acaoPadrao('9º Ano', fundamental)).toBe('sair');
    expect(acaoPadrao('9º Ano', new Set([...fundamental, '1ª Série']))).toBe(
      'promover',
    );
  });
});

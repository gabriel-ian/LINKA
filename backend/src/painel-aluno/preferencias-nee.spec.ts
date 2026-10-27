import { preferenciasSugeridas } from './preferencias-nee';

describe('preferenciasSugeridas', () => {
  it('liga a letra e a regua de leitura para dislexia', () => {
    expect(preferenciasSugeridas(['Dislexia'])).toEqual({
      ouvirVoz: true,
      fonteDislexia: true,
      reguaLeitura: true,
    });
  });

  it('junta as ajudas de mais de um diagnostico', () => {
    expect(preferenciasSugeridas(['TDAH', 'Deficiência visual'])).toEqual({
      passosCurtos: true,
      tempoPasso: true,
      ouvirVoz: true,
      letrasMaiores: true,
      tamanhoLetra: 2,
      altoContraste: true,
    });
  });

  it('nao liga a voz para quem tem deficiencia auditiva', () => {
    expect(
      preferenciasSugeridas(['Deficiência auditiva', 'Dislexia']).ouvirVoz,
    ).toBe(false);
  });

  it('sem diagnostico nao muda nada', () => {
    expect(preferenciasSugeridas([])).toEqual({});
    expect(preferenciasSugeridas(['Outro'])).toEqual({});
  });
});

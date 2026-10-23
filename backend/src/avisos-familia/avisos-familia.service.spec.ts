import { horaDeAvisar, textoPrazo } from './avisos-familia.service';
import { faixaDoHorario, preferenciasDe } from '../painel-familia/preferencias';

const as = (h: number, m = 0) => new Date(2026, 9, 19, h, m);

describe('lembrete de tarefa nao iniciada', () => {
  it('com hora limite: avisa nas 3h antes do prazo', () => {
    expect(horaDeAvisar('18:00:00', '8h às 12h', as(14, 59))).toBe(false);
    expect(horaDeAvisar('18:00:00', '8h às 12h', as(15, 0))).toBe(true);
    expect(horaDeAvisar('18:00:00', '8h às 12h', as(17, 45))).toBe(true);
    expect(horaDeAvisar('18:00:00', '8h às 12h', as(18, 0))).toBe(false);
  });

  it('sem hora limite: avisa no horario preferido da familia', () => {
    expect(horaDeAvisar(null, '18h às 21h', as(17, 50))).toBe(false);
    expect(horaDeAvisar(null, '18h às 21h', as(19, 15))).toBe(true);
    expect(horaDeAvisar(null, '18h às 21h', as(21, 0))).toBe(false);
  });

  it('texto do prazo', () => {
    expect(textoPrazo('18:00:00')).toBe('hoje às 18h');
    expect(textoPrazo('07:30')).toBe('hoje às 7h30');
    expect(textoPrazo(null)).toBe('hoje');
  });
});

describe('preferencias da familia', () => {
  it('le JSON salvo como texto e completa com o padrao', () => {
    const p = preferenciasDe('{"avisosEscola":false}');
    expect(p.avisosEscola).toBe(false);
    expect(p.tarefaConcluida).toBe(true);
    expect(preferenciasDe(null).horario).toBe('14h às 18h');
  });

  it('faixa de horario desconhecida cai no padrao', () => {
    expect(faixaDoHorario('12h às 14h')).toEqual([12, 14]);
    expect(faixaDoHorario('qualquer')).toEqual([14, 18]);
  });
});

import { momentoDoPasso } from './painel-aluno.service';

describe('momentoDoPasso (passo feito sem internet)', () => {
  const agora = new Date('2026-10-18T15:00:00.000Z');

  it('sem feitoEm usa a hora do envio', () => {
    expect(momentoDoPasso(undefined, agora)).toBe(agora);
  });

  it('aceita a hora real de ate 7 dias atras', () => {
    const ontem = '2026-10-17T20:30:00.000Z';
    expect(momentoDoPasso(ontem, agora).toISOString()).toBe(ontem);
  });

  it('ignora hora no futuro ou antiga demais', () => {
    expect(momentoDoPasso('2026-10-19T10:00:00.000Z', agora)).toBe(agora);
    expect(momentoDoPasso('2026-10-01T10:00:00.000Z', agora)).toBe(agora);
  });

  it('ignora data invalida', () => {
    expect(momentoDoPasso('ontem', agora)).toBe(agora);
  });
});

import { LimiteGuard } from './limite.guard';

/** Expoe o getTracker (protegido) so para o teste. */
class GuardTeste extends LimiteGuard {
  chave(req: Parameters<LimiteGuard['getTracker']>[0]) {
    return this.getTracker(req);
  }
}

function token(payload: object): string {
  const parte = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `Bearer cabecalho.${parte}.assinatura`;
}

describe('LimiteGuard', () => {
  const guard = Object.create(GuardTeste.prototype) as GuardTeste;

  it('no login conta por IP + e-mail (sem diferenciar maiusculas)', async () => {
    const chave = await guard.chave({
      ip: '10.0.0.1',
      path: '/auth/login',
      headers: {},
      body: { email: ' Escola@Linka.com ' },
    });
    expect(chave).toBe('login:10.0.0.1:escola@linka.com');
  });

  it('alunos da mesma sala (mesmo IP) tem contagens separadas', async () => {
    const a = await guard.chave({
      ip: '10.0.0.1',
      path: '/painel-aluno/resumo',
      headers: { authorization: token({ sub: 12 }) },
    });
    const b = await guard.chave({
      ip: '10.0.0.1',
      path: '/painel-aluno/resumo',
      headers: { authorization: token({ sub: 13 }) },
    });
    expect(a).toBe('usuario:12');
    expect(b).toBe('usuario:13');
  });

  it('sem token valido conta pelo IP', async () => {
    expect(
      await guard.chave({
        ip: '10.0.0.2',
        path: '/escola',
        headers: { authorization: 'Bearer lixo' },
      }),
    ).toBe('ip:10.0.0.2');
  });
});

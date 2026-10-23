import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import { EmailService } from '../email/email.service';
import { Usuario } from '../usuario/usuario.entity';
import { UsuarioService } from '../usuario/usuario.service';
import { RedefinirSenhaService } from './redefinir-senha.service';

describe('RedefinirSenhaService', () => {
  let query: jest.Mock;
  let findByEmail: jest.Mock;
  let definirSenha: jest.Mock;
  let enviar: jest.Mock;
  let service: RedefinirSenhaService;

  beforeEach(() => {
    query = jest.fn().mockResolvedValue([]);
    findByEmail = jest.fn();
    definirSenha = jest.fn();
    enviar = jest.fn().mockResolvedValue(true);
    service = new RedefinirSenhaService(
      { query } as unknown as DataSource,
      { findByEmail, definirSenha } as unknown as UsuarioService,
      {
        enviar,
        disponivel: true,
        url: (c: string) => 'http://linka' + c,
      } as unknown as EmailService,
    );
  });

  const usuario = (extra: Partial<Usuario> = {}) =>
    ({
      id: 7,
      email: 'ana@x.com',
      ativo: true,
      escola: { ativo: true },
      ...extra,
    }) as Usuario;

  it('e-mail desconhecido: responde igual e nao envia nada', async () => {
    findByEmail.mockResolvedValue(null);
    await expect(service.pedir('nada@x.com')).resolves.toEqual({ data: true });
    expect(enviar).not.toHaveBeenCalled();
  });

  it('conta desativada ou escola desativada nao recebe link', async () => {
    findByEmail.mockResolvedValue(usuario({ ativo: false }));
    await service.pedir('ana@x.com');
    findByEmail.mockResolvedValue(
      usuario({ escola: { ativo: false } } as Partial<Usuario>),
    );
    await service.pedir('ana@x.com');
    expect(enviar).not.toHaveBeenCalled();
  });

  it('envia o link e guarda so o hash do codigo', async () => {
    findByEmail.mockResolvedValue(usuario());
    await service.pedir(' Ana@X.com ');

    expect(findByEmail).toHaveBeenCalledWith('ana@x.com');
    const insert = query.mock.calls.find(([sql]) =>
      String(sql).startsWith('INSERT'),
    );
    const [, [, hashGravado]] = insert as [string, [number, string, number]];
    const texto = (enviar.mock.calls[0][1] as { texto: string }).texto;
    const token = /token=([\w-]+)/.exec(texto)![1];
    expect(hashGravado).toBe(createHash('sha256').update(token).digest('hex'));
    expect(texto).not.toContain(hashGravado);
  });

  it('nao reenvia se pediu ha pouco', async () => {
    findByEmail.mockResolvedValue(usuario());
    query.mockResolvedValueOnce([{ 1: 1 }]);
    await service.pedir('ana@x.com');
    expect(enviar).not.toHaveBeenCalled();
  });

  it('link valido troca a senha e fica usado', async () => {
    query.mockResolvedValueOnce([{ id: 3, usuarioId: 7 }]);
    await service.redefinir('codigo', 'novaSenha123');
    expect(definirSenha).toHaveBeenCalledWith(7, 'novaSenha123');
    expect(query).toHaveBeenLastCalledWith(
      'UPDATE senha_reset SET usado_em = NOW() WHERE id = ?',
      [3],
    );
  });

  it('link invalido, usado ou vencido e recusado', async () => {
    await expect(service.redefinir('x', 'novaSenha123')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(definirSenha).not.toHaveBeenCalled();
  });
});

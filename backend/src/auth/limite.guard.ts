import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

interface Requisicao {
  ip?: string;
  path?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: { email?: unknown };
}

/**
 * Limite de requisicoes que nao pune a escola inteira: numa sala, varios
 * alunos saem pelo mesmo IP. Por isso conta por usuario logado e, no login,
 * por IP + e-mail (trava quem tenta adivinhar a senha de uma conta).
 */
@Injectable()
export class LimiteGuard extends ThrottlerGuard {
  protected getTracker(req: Requisicao): Promise<string> {
    const ip = req.ip ?? 'sem-ip';

    if (req.path?.endsWith('/auth/login')) {
      const email =
        typeof req.body?.email === 'string'
          ? req.body.email.trim().toLowerCase()
          : '';
      return Promise.resolve(`login:${ip}:${email}`);
    }

    const usuario = usuarioDoToken(req.headers.authorization);
    return Promise.resolve(usuario ? `usuario:${usuario}` : `ip:${ip}`);
  }
}

/**
 * Le o "sub" do JWT so para separar a contagem; a validade do token continua
 * sendo conferida pelo JwtAuthGuard. Token falso cai no 401 de qualquer forma.
 */
function usuarioDoToken(cabecalho: string | string[] | undefined): string {
  if (typeof cabecalho !== 'string' || !cabecalho.startsWith('Bearer ')) {
    return '';
  }
  try {
    const payload = JSON.parse(
      Buffer.from(cabecalho.slice(7).split('.')[1], 'base64url').toString(),
    ) as { sub?: unknown };
    return typeof payload.sub === 'number' || typeof payload.sub === 'string'
      ? String(payload.sub)
      : '';
  } catch {
    return '';
  }
}

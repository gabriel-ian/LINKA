import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Devolve o e-mail do usuario logado, lido do token (ver JwtStrategy).
 * Usado para registrar quem fez a ultima alteracao em uma escola.
 */
export const UsuarioEmail = createParamDecorator(
  (_dados: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.email ?? null;
  },
);

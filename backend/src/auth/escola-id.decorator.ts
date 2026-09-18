import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Devolve o escola_id do usuario logado, lido do token.
 *
 * Antes os controllers usavam req.user.userId como se fosse o id da escola —
 * era o mesmo numero por coincidencia, porque o login era feito na tabela
 * `escola`. Com o login em `usuario`, sub e escolaId sao coisas diferentes.
 */
export const EscolaId = createParamDecorator(
  (_dados: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    const escolaId = request.user?.escolaId;

    if (escolaId === null || escolaId === undefined) {
      throw new ForbiddenException(
        'Este usuario nao esta vinculado a nenhuma escola',
      );
    }

    return Number(escolaId);
  },
);

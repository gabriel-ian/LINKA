import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Devolve o id do usuario logado, lido do token — mesmo espirito do
 * @EscolaId(): nunca confiar em id vindo do corpo da requisicao para
 * descobrir quem esta logado.
 *
 * O JwtStrategy.validate() mapeia o `sub` do payload para `userId` em
 * request.user (ver auth/jwt.strategy.ts); e esse campo que lemos aqui,
 * nao `sub` diretamente.
 *
 * Usado por rotas de professor que precisam do id da linha `professor`
 * (nao o id de `usuario`): o service resolve professor.usuario_id = userId.
 */
export const UsuarioId = createParamDecorator(
  (_dados: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    return Number(request.user?.userId);
  },
);

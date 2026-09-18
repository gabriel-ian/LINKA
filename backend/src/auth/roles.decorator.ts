import { SetMetadata } from '@nestjs/common';
import { PerfilUsuario } from '../usuario/usuario.entity';

export const ROLES_KEY = 'roles';

/** Restringe a rota aos perfis informados. Use junto com RolesGuard. */
export const Roles = (...perfis: PerfilUsuario[]) =>
  SetMetadata(ROLES_KEY, perfis);

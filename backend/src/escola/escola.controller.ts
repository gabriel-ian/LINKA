import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EscolaService } from './escola.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';

/**
 * Rotas da propria escola logada.
 * O CRUD de escolas e exclusivo do admin e vive em /admin/escolas.
 */
@ApiTags('Escolas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('escolas')
export class EscolaController {
  constructor(private readonly escolaService: EscolaService) {}

  @Get('me')
  @Roles('escola', 'professor')
  @ApiOperation({ summary: 'Buscar a escola do usuario logado' })
  getMinhaEscola(@EscolaId() escolaId: number) {
    return this.escolaService.findOne(escolaId);
  }
}

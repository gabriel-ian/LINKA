import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

import { EscolaService } from '../escola/escola.service';
import { CreateEscolaDto } from '../escola/dto/create-escola.dto';
import { UpdateEscolaDto } from '../escola/dto/update-escola.dto';
import { DesativarEscolaDto } from '../escola/dto/desativar-escola.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsuarioEmail } from '../auth/usuario-email.decorator';

/**
 * CRUD de escolas — exclusivo do administrador Linka.
 * A checagem de perfil agora e feita pelo RolesGuard, nao mais
 * por um checkAdmin repetido em cada metodo.
 */
@ApiTags('Admin - Escolas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/escolas')
export class AdminController {
  constructor(private readonly escolaService: EscolaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as escolas' })
  findAll() {
    return this.escolaService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar escola por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.escolaService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar nova escola (cria tambem o login da escola)' })
  create(@Body() body: CreateEscolaDto) {
    return this.escolaService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar escola' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateEscolaDto,
    @UsuarioEmail() adminEmail: string | null,
  ) {
    return this.escolaService.update(id, body, adminEmail);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desativar escola (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.escolaService.remove(id);
  }

  @Patch(':id/desativar')
  @ApiOperation({ summary: 'Desativar escola com motivo e data' })
  desativar(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: DesativarEscolaDto,
    @UsuarioEmail() adminEmail: string | null,
  ) {
    return this.escolaService.desativar(id, body, adminEmail);
  }

  @Post(':id/senha')
  @ApiOperation({ summary: 'Gerar senha provisoria para o login da escola' })
  redefinirSenha(@Param('id', ParseIntPipe) id: number) {
    return this.escolaService.redefinirSenha(id);
  }

  @Patch(':id/ativar')
  @ApiOperation({ summary: 'Reativar escola' })
  activate(
    @Param('id', ParseIntPipe) id: number,
    @UsuarioEmail() adminEmail: string | null,
  ) {
    return this.escolaService.activate(id, adminEmail);
  }
}

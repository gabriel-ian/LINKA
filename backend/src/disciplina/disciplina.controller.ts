import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DisciplinaService } from './disciplina.service';
import { CreateDisciplinaDto } from './dto/create-disciplina.dto';

/**
 * Catalogo global de disciplinas. Leitura liberada para qualquer usuario
 * logado (escola/professor precisam dela para montar a grade); escrita
 * e exclusiva do admin, assim como o CRUD de escolas.
 */
@ApiTags('Disciplinas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('disciplinas')
export class DisciplinaController {
  constructor(private readonly disciplinaService: DisciplinaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar disciplinas' })
  findAll() {
    return this.disciplinaService.findAll();
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Cadastrar disciplina (exclusivo do admin)' })
  create(@Body() body: CreateDisciplinaDto) {
    return this.disciplinaService.create(body);
  }
}

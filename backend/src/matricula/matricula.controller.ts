import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';
import { MatriculaService } from './matricula.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';

@ApiTags('Matriculas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola', 'professor')
@Controller('matriculas')
export class MatriculaController {
  constructor(private readonly matriculaService: MatriculaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar matriculas da escola logada' })
  findAll(@EscolaId() escolaId: number) {
    return this.matriculaService.findAllByEscola(escolaId);
  }

  @Post()
  @Roles('escola')
  @ApiOperation({ summary: 'Matricular aluno em turma' })
  create(@Body() body: CreateMatriculaDto, @EscolaId() escolaId: number) {
    return this.matriculaService.create(body, escolaId);
  }
}

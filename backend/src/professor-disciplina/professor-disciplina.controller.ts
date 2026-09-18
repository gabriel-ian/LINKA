import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';
import { ProfessorDisciplinaService } from './professor-disciplina.service';
import { CreateProfessorDisciplinaDto } from './dto/create-professor-disciplina.dto';

@ApiTags('Professor-Disciplina')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola', 'professor')
@Controller('professor-disciplinas')
export class ProfessorDisciplinaController {
  constructor(
    private readonly professorDisciplinaService: ProfessorDisciplinaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar habilitacoes da escola logada' })
  findAll(@EscolaId() escolaId: number) {
    return this.professorDisciplinaService.findAllByEscola(escolaId);
  }

  @Post()
  @Roles('escola')
  @ApiOperation({ summary: 'Habilitar professor a lecionar uma disciplina' })
  create(
    @Body() body: CreateProfessorDisciplinaDto,
    @EscolaId() escolaId: number,
  ) {
    return this.professorDisciplinaService.create(body, escolaId);
  }

  @Delete(':professorId/:disciplinaId')
  @Roles('escola')
  @ApiOperation({ summary: 'Remover habilitacao' })
  remove(
    @Param('professorId', ParseIntPipe) professorId: number,
    @Param('disciplinaId', ParseIntPipe) disciplinaId: number,
    @EscolaId() escolaId: number,
  ) {
    return this.professorDisciplinaService.remove(
      professorId,
      disciplinaId,
      escolaId,
    );
  }
}

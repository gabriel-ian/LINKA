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
import { TurmaProfessorDisciplinaService } from './turma-professor-disciplina.service';
import { CreateAlocacaoDto } from './dto/create-alocacao.dto';

/** Tabela `turma_professor_disciplina`: a grade horaria da escola. */
@ApiTags('Alocacoes (grade)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola', 'professor')
@Controller('alocacoes')
export class TurmaProfessorDisciplinaController {
  constructor(
    private readonly alocacaoService: TurmaProfessorDisciplinaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar a grade da escola logada' })
  findAll(@EscolaId() escolaId: number) {
    return this.alocacaoService.findAllByEscola(escolaId);
  }

  @Post()
  @Roles('escola')
  @ApiOperation({
    summary: 'Alocar professor + disciplina em uma turma',
  })
  create(@Body() body: CreateAlocacaoDto, @EscolaId() escolaId: number) {
    return this.alocacaoService.create(body, escolaId);
  }

  @Delete(':id')
  @Roles('escola')
  @ApiOperation({ summary: 'Remover alocacao' })
  remove(@Param('id', ParseIntPipe) id: number, @EscolaId() escolaId: number) {
    return this.alocacaoService.remove(id, escolaId);
  }
}

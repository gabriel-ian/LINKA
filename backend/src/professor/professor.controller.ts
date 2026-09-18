import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';
import { ProfessorService } from './professor.service';
import { CreateProfessorDto } from './dto/create-professor.dto';

@ApiTags('Professores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola')
@Controller('professores')
export class ProfessorController {
  constructor(private readonly professorService: ProfessorService) {}

  @Get()
  @ApiOperation({ summary: 'Listar professores da escola logada' })
  // Antes: req.user.id (sempre undefined) — a strategy devolve userId, nao id.
  findAll(@EscolaId() escolaId: number) {
    return this.professorService.findAllByEscola(escolaId);
  }

  @Post()
  @ApiOperation({
    summary: 'Cadastrar professor',
    description: 'Cria o usuario de acesso e o registro do professor juntos.',
  })
  create(@Body() body: CreateProfessorDto, @EscolaId() escolaId: number) {
    return this.professorService.create(body, escolaId);
  }
}

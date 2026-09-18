import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';
import { TurmaService } from './turma.service';
import { CreateTurmaDto } from './dto/create-turma.dto';

@ApiTags('Turmas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola', 'professor')
@Controller('turmas')
export class TurmaController {
  constructor(private readonly turmaService: TurmaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar turmas da escola logada' })
  findAll(@EscolaId() escolaId: number) {
    return this.turmaService.findAllByEscola(escolaId);
  }

  @Post()
  @Roles('escola')
  @ApiOperation({ summary: 'Cadastrar turma' })
  create(@Body() body: CreateTurmaDto, @EscolaId() escolaId: number) {
    return this.turmaService.create(body, escolaId);
  }
}

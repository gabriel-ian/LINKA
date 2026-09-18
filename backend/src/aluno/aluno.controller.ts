import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';
import { AlunoService } from './aluno.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';

@ApiTags('Alunos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola', 'professor')
@Controller('alunos')
export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar alunos da escola logada' })
  findAll(@EscolaId() escolaId: number) {
    return this.alunoService.findAllByEscola(escolaId);
  }

  @Post()
  @Roles('escola')
  @ApiOperation({ summary: 'Cadastrar aluno' })
  create(@Body() body: CreateAlunoDto, @EscolaId() escolaId: number) {
    return this.alunoService.create(body, escolaId);
  }
}

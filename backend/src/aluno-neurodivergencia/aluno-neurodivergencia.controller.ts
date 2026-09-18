import {
  Body,
  Controller,
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
import { AlunoNeurodivergenciaService } from './aluno-neurodivergencia.service';
import { CreateAlunoNeurodivergenciaDto } from './dto/create-aluno-neurodivergencia.dto';

@ApiTags('Aluno-Neurodivergencia')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola', 'professor')
@Controller('aluno-neurodivergencias')
export class AlunoNeurodivergenciaController {
  constructor(
    private readonly alunoNeurodivergenciaService: AlunoNeurodivergenciaService,
  ) {}

  @Get(':alunoId')
  @ApiOperation({ summary: 'Listar neurodivergencias de um aluno' })
  findAllByAluno(
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @EscolaId() escolaId: number,
  ) {
    return this.alunoNeurodivergenciaService.findAllByAluno(
      alunoId,
      escolaId,
    );
  }

  @Post()
  @Roles('escola')
  @ApiOperation({ summary: 'Vincular neurodivergencia a um aluno' })
  create(
    @Body() body: CreateAlunoNeurodivergenciaDto,
    @EscolaId() escolaId: number,
  ) {
    return this.alunoNeurodivergenciaService.create(body, escolaId);
  }
}

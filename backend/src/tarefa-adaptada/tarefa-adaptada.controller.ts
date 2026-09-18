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
import { TarefaAdaptadaService } from './tarefa-adaptada.service';
import { CreateTarefaAdaptadaDto } from './dto/create-tarefa-adaptada.dto';

@ApiTags('Tarefas Adaptadas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola', 'professor')
@Controller('tarefas-adaptadas')
export class TarefaAdaptadaController {
  constructor(
    private readonly tarefaAdaptadaService: TarefaAdaptadaService,
  ) {}

  @Get(':tarefaId')
  @ApiOperation({ summary: 'Listar adaptacoes de uma tarefa' })
  findAllByTarefa(
    @Param('tarefaId', ParseIntPipe) tarefaId: number,
    @EscolaId() escolaId: number,
  ) {
    return this.tarefaAdaptadaService.findAllByTarefa(tarefaId, escolaId);
  }

  @Post()
  @Roles('professor')
  @ApiOperation({ summary: 'Criar adaptacao de uma tarefa para um aluno' })
  create(
    @Body() body: CreateTarefaAdaptadaDto,
    @EscolaId() escolaId: number,
  ) {
    return this.tarefaAdaptadaService.create(body, escolaId);
  }
}

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';
import { UsuarioId } from '../auth/usuario-id.decorator';
import { TarefaService } from './tarefa.service';
import { CreateTarefaDto } from './dto/create-tarefa.dto';

@ApiTags('Tarefas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola', 'professor')
@Controller('tarefas')
export class TarefaController {
  constructor(private readonly tarefaService: TarefaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar tarefas da escola logada' })
  findAll(@EscolaId() escolaId: number) {
    return this.tarefaService.findAllByEscola(escolaId);
  }

  @Post()
  @Roles('professor')
  @ApiOperation({
    summary: 'Cadastrar tarefa',
    description: 'O professor autor e resolvido pelo servidor, via token.',
  })
  create(
    @Body() body: CreateTarefaDto,
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
  ) {
    return this.tarefaService.create(body, usuarioId, escolaId);
  }
}

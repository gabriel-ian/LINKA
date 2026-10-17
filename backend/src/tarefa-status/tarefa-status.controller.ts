import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';
import { UsuarioId } from '../auth/usuario-id.decorator';
import { TarefaStatusService } from './tarefa-status.service';
import { UpdateTarefaStatusDto } from './dto/update-tarefa-status.dto';

@ApiTags('Status de Tarefa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tarefas-status')
export class TarefaStatusController {
  constructor(private readonly tarefaStatusService: TarefaStatusService) {}

  @Get('aluno/:alunoId')
  @Roles('escola', 'professor')
  @ApiOperation({ summary: 'Status das tarefas de um aluno da escola logada' })
  findAllByAluno(
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @EscolaId() escolaId: number,
  ) {
    return this.tarefaStatusService.findAllByAluno(alunoId, escolaId);
  }

  @Patch()
  @Roles('escola', 'professor')
  @ApiOperation({
    summary: 'Marcar tarefa como concluida/pendente para um aluno',
  })
  updateStatus(
    @Body() body: UpdateTarefaStatusDto,
    @EscolaId() escolaId: number,
  ) {
    return this.tarefaStatusService.updateStatus(body, escolaId);
  }

  @Get('meus-filhos')
  @Roles('responsavel')
  @ApiOperation({
    summary: 'Status das tarefas dos alunos vinculados ao responsavel logado',
  })
  findAllByResponsavel(@UsuarioId() usuarioId: number) {
    return this.tarefaStatusService.findAllByResponsavelUsuarioId(usuarioId);
  }
}

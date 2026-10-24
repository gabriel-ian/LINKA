import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UsuarioId } from '../auth/usuario-id.decorator';
import { PainelAlunoService } from './painel-aluno.service';
import {
  AjudaDto,
  ConcluirPassoDto,
  LembreteDto,
  PreferenciasDto,
  RespostaDto,
} from './dto/painel-aluno.dto';

/** Rotas das telas "Aluno - ..." do Figma. O aluno vem sempre do token. */
@ApiTags('Painel do aluno')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('aluno')
@Controller('painel-aluno')
export class PainelAlunoController {
  constructor(private readonly painel: PainelAlunoService) {}

  @Get('resumo')
  @ApiOperation({ summary: 'Dados do aluno, pontos, nivel e tarefas' })
  resumo(@UsuarioId() usuarioId: number) {
    return this.painel.resumo(usuarioId);
  }

  @Get('tarefas/:id')
  @ApiOperation({ summary: 'Tarefa com os passos da versao do aluno' })
  tarefa(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.tarefa(usuarioId, id);
  }

  @Post('tarefas/:id/passos')
  @ApiOperation({ summary: 'Conclui um passo; o ultimo conclui a tarefa' })
  concluirPasso(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ConcluirPassoDto,
  ) {
    return this.painel.concluirPasso(usuarioId, id, dto.passo, dto.feitoEm);
  }

  @Post('tarefas/:id/ajuda')
  @ApiOperation({
    summary: 'Explicar de outro jeito, exemplo (IA) ou avisar a professora',
  })
  ajuda(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AjudaDto,
  ) {
    return this.painel.ajuda(usuarioId, id, dto);
  }

  @Post('tarefas/:id/resposta')
  @ApiOperation({
    summary: 'Entrega (ou reenvia) a resposta escrita da tarefa',
  })
  resposta(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RespostaDto,
  ) {
    return this.painel.entregarResposta(usuarioId, id, dto.resposta);
  }

  @Get('avisos')
  @ApiOperation({ summary: 'Avisos da turma (versao simplificada para NEE)' })
  avisos(@UsuarioId() usuarioId: number) {
    return this.painel.listarAvisos(usuarioId);
  }

  @Post('avisos/:id/lido')
  @ApiOperation({ summary: 'Marca o aviso como lido pelo aluno' })
  avisoLido(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.marcarAvisoLido(usuarioId, id);
  }

  @Post('incentivos/:id/lido')
  @ApiOperation({ summary: 'Marca o recado da familia como visto' })
  incentivoLido(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.marcarIncentivoLido(usuarioId, id);
  }

  @Get('progresso')
  @ApiOperation({ summary: 'Meu progresso' })
  progresso(@UsuarioId() usuarioId: number) {
    return this.painel.progresso(usuarioId);
  }

  @Get('conquistas')
  @ApiOperation({ summary: 'Nivel e conquistas' })
  conquistas(@UsuarioId() usuarioId: number) {
    return this.painel.conquistas(usuarioId);
  }

  @Get('agenda')
  @ApiOperation({
    summary: 'Semana com tarefas e lembretes (?semana=AAAA-MM-DD)',
  })
  agenda(@UsuarioId() usuarioId: number, @Query('semana') semana?: string) {
    return this.painel.agenda(usuarioId, semana);
  }

  @Post('lembretes')
  @ApiOperation({ summary: 'Novo lembrete na agenda' })
  criarLembrete(@UsuarioId() usuarioId: number, @Body() dto: LembreteDto) {
    return this.painel.criarLembrete(usuarioId, dto);
  }

  @Delete('lembretes/:id')
  @ApiOperation({ summary: 'Remover lembrete' })
  removerLembrete(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.removerLembrete(usuarioId, id);
  }

  @Patch('preferencias')
  @ApiOperation({ summary: 'Meu perfil: preferencias, mascote e interesses' })
  preferencias(@UsuarioId() usuarioId: number, @Body() dto: PreferenciasDto) {
    return this.painel.salvarPreferencias(usuarioId, dto);
  }
}

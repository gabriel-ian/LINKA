import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';
import { UsuarioId } from '../auth/usuario-id.decorator';
import { PainelProfessorService } from './painel-professor.service';
import {
  CriarTarefaProfessorDto,
  EditarAdaptacaoDto,
  SalvarComunicadoDto,
} from './dto/professor.dto';

/** Rotas das telas "Professor - ..." do Figma. Exclusivo do perfil professor. */
@ApiTags('Painel do professor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('professor')
@Controller('painel-professor')
export class PainelProfessorController {
  constructor(private readonly painel: PainelProfessorService) {}

  @Get('contexto')
  @ApiOperation({
    summary: 'Nome, escola, disciplinas e turmas do professor logado',
  })
  contexto(@UsuarioId() usuarioId: number, @EscolaId() escolaId: number) {
    return this.painel.contexto(usuarioId, escolaId);
  }

  @Get('turmas/:id/visao')
  @ApiOperation({ summary: 'Visao geral da turma' })
  visao(
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.visao(usuarioId, escolaId, id);
  }

  @Get('turmas/:id/alunos')
  @ApiOperation({ summary: 'Alunos da turma com entregas e ultima atividade' })
  alunos(
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.alunos(usuarioId, escolaId, id);
  }

  @Get('alunos/:id')
  @ApiOperation({ summary: 'Perfil do aluno (so de turmas do professor)' })
  aluno(
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.aluno(usuarioId, escolaId, id);
  }

  @Post('tarefas')
  @ApiOperation({ summary: 'Criar tarefa para uma turma do professor' })
  criarTarefa(
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
    @Body() dto: CriarTarefaProfessorDto,
  ) {
    return this.painel.criarTarefa(usuarioId, escolaId, dto);
  }

  @Get('tarefas')
  @ApiOperation({
    summary:
      'Tarefas do professor com entregas e adaptacoes (filtro opcional por turma)',
  })
  tarefas(
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
    @Query('turmaId') turmaId?: string,
  ) {
    return this.painel.listarTarefas(
      usuarioId,
      escolaId,
      turmaId ? Number(turmaId) || undefined : undefined,
    );
  }

  @Get('tarefas/:id')
  @ApiOperation({ summary: 'Tarefa com as versoes adaptadas dos alunos NEE' })
  tarefa(
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.tarefa(usuarioId, escolaId, id);
  }

  @Post('tarefas/:id/adaptar')
  @ApiOperation({
    summary:
      'Gerar com IA as versoes adaptadas que faltam (ou refazer a de um aluno)',
  })
  adaptar(
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('alunoId') alunoId?: string,
  ) {
    return this.painel.adaptar(
      usuarioId,
      escolaId,
      id,
      alunoId ? Number(alunoId) || undefined : undefined,
    );
  }

  @Put('tarefas/:id/adaptacoes/:alunoId')
  @ApiOperation({ summary: 'Editar a versao adaptada de um aluno' })
  editarAdaptacao(
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @Body() dto: EditarAdaptacaoDto,
  ) {
    return this.painel.editarAdaptacao(usuarioId, escolaId, id, alunoId, dto);
  }

  @Get('comunicados')
  @ApiOperation({ summary: 'Comunicados enviados e rascunhos do professor' })
  comunicados(@UsuarioId() usuarioId: number, @EscolaId() escolaId: number) {
    return this.painel.comunicados(usuarioId, escolaId);
  }

  @Post('comunicados')
  @ApiOperation({ summary: 'Enviar comunicado ou salvar rascunho' })
  salvarComunicado(
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
    @Body() dto: SalvarComunicadoDto,
  ) {
    return this.painel.salvarComunicado(usuarioId, escolaId, dto);
  }

  @Get('relatorio')
  @ApiOperation({ summary: 'Relatorio da turma no mes' })
  relatorio(
    @UsuarioId() usuarioId: number,
    @EscolaId() escolaId: number,
    @Query('turmaId', ParseIntPipe) turmaId: number,
    @Query('mes') mes?: string,
    @Query('alunos') alunos?: string,
  ) {
    return this.painel.relatorio(usuarioId, escolaId, {
      turmaId,
      mes: mes && /^\d{4}-\d{2}$/.test(mes) ? mes : undefined,
      apenasNee: alunos === 'nee',
    });
  }
}

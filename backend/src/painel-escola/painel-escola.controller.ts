import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';
import { PainelEscolaService } from './painel-escola.service';
import {
  CadastrosEscolaService,
  LAUDO_TAMANHO_MAXIMO,
} from './cadastros-escola.service';
import {
  AtualizarProfessorDto,
  CriarAlunoDto,
  CriarProfessorDto,
  CriarTurmaDto,
  EditarAlunoDto,
  EditarTurmaDto,
} from './dto/cadastros.dto';

/**
 * Rotas das telas "Escola - ..." do Figma. Exclusivo do perfil escola;
 * o escopo vem sempre do escolaId do token.
 */
@ApiTags('Painel da escola')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola')
@Controller('painel-escola')
export class PainelEscolaController {
  constructor(
    private readonly painel: PainelEscolaService,
    private readonly cadastros: CadastrosEscolaService,
  ) {}

  @Get('opcoes')
  @ApiOperation({
    summary:
      'Listas para os formularios (disciplinas, diagnosticos, turmas, professores)',
  })
  opcoes(@EscolaId() escolaId: number) {
    return this.painel.opcoes(escolaId);
  }

  @Get('turmas')
  @ApiOperation({
    summary: 'Turmas com professores, totais e desempenho NEE do mes',
  })
  turmas(@EscolaId() escolaId: number) {
    return this.painel.listarTurmas(escolaId);
  }

  @Get('turmas/:id')
  @ApiOperation({ summary: 'Detalhe da turma com alunos NEE' })
  turma(@EscolaId() escolaId: number, @Param('id', ParseIntPipe) id: number) {
    return this.painel.detalharTurma(escolaId, id);
  }

  @Post('turmas')
  @ApiOperation({ summary: 'Criar turma e vincular professores' })
  criarTurma(@EscolaId() escolaId: number, @Body() dto: CriarTurmaDto) {
    return this.cadastros.criarTurma(dto, escolaId);
  }

  @Patch('turmas/:id')
  @ApiOperation({ summary: 'Editar turma (dados e professores)' })
  editarTurma(
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarTurmaDto,
  ) {
    return this.cadastros.editarTurma(id, dto, escolaId);
  }

  @Get('professores')
  @ApiOperation({ summary: 'Professores com disciplinas, turmas e status' })
  professores(@EscolaId() escolaId: number) {
    return this.painel.listarProfessores(escolaId);
  }

  @Post('professores')
  @ApiOperation({ summary: 'Cadastrar professor (cria o login)' })
  criarProfessor(@EscolaId() escolaId: number, @Body() dto: CriarProfessorDto) {
    return this.cadastros.criarProfessor(dto, escolaId);
  }

  @Patch('professores/:id')
  @ApiOperation({ summary: 'Ativar ou desativar o login do professor' })
  atualizarProfessor(
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarProfessorDto,
  ) {
    return this.cadastros.atualizarProfessor(id, dto, escolaId);
  }

  @Post('professores/:id/senha')
  @ApiOperation({ summary: 'Gerar senha provisoria para o professor' })
  senhaProfessor(
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cadastros.redefinirSenha('professor', id, escolaId);
  }

  @Get('alunos')
  @ApiOperation({ summary: 'Alunos com diagnosticos e desempenho da semana' })
  alunos(@EscolaId() escolaId: number) {
    return this.painel.listarAlunos(escolaId);
  }

  @Get('alunos/:id')
  @ApiOperation({ summary: 'Perfil do aluno' })
  aluno(@EscolaId() escolaId: number, @Param('id', ParseIntPipe) id: number) {
    return this.painel.detalharAluno(escolaId, id);
  }

  @Post('alunos')
  @ApiOperation({
    summary: 'Cadastrar aluno, matricular e vincular responsavel',
  })
  criarAluno(@EscolaId() escolaId: number, @Body() dto: CriarAlunoDto) {
    return this.cadastros.criarAluno(dto, escolaId);
  }

  @Patch('alunos/:id')
  @ApiOperation({
    summary:
      'Editar aluno (dados, diagnosticos, perfil de aprendizagem, turma)',
  })
  editarAluno(
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarAlunoDto,
  ) {
    return this.cadastros.editarAluno(id, dto, escolaId);
  }

  @Post('alunos/:id/senha')
  @ApiOperation({ summary: 'Gerar senha provisoria para o aluno' })
  senhaAluno(
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cadastros.redefinirSenha('aluno', id, escolaId);
  }

  @Post('responsaveis/:id/senha')
  @ApiOperation({
    summary: 'Gerar senha provisoria para o responsavel de um aluno da escola',
  })
  senhaResponsavel(
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.cadastros.redefinirSenha('responsavel', id, escolaId);
  }

  @Post('alunos/:id/laudo')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Anexar laudo clinico (PDF, PNG ou JPG, ate 10 MB)',
  })
  @UseInterceptors(
    FileInterceptor('arquivo', { limits: { fileSize: LAUDO_TAMANHO_MAXIMO } }),
  )
  enviarLaudo(
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() arquivo: Express.Multer.File,
  ) {
    return this.cadastros.salvarLaudo(id, escolaId, arquivo);
  }

  @Get('alunos/:id/laudo')
  @ApiOperation({ summary: 'Baixar o laudo do aluno' })
  async baixarLaudo(
    @EscolaId() escolaId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const laudo = await this.cadastros.caminhoLaudo(id, escolaId);
    return new StreamableFile(createReadStream(laudo.caminho), {
      type: laudo.mime,
      disposition: `attachment; filename="${laudo.nomeDownload}"`,
    });
  }

  @Get('relatorio')
  @ApiOperation({
    summary: 'Indicadores do mes (filtros opcionais por turma e diagnostico)',
  })
  relatorio(
    @EscolaId() escolaId: number,
    @Query('mes') mes?: string,
    @Query('turmaId') turmaId?: string,
    @Query('diagnosticoId') diagnosticoId?: string,
  ) {
    return this.painel.relatorio(escolaId, {
      mes: mes && /^\d{4}-\d{2}$/.test(mes) ? mes : undefined,
      turmaId: turmaId ? Number(turmaId) || undefined : undefined,
      diagnosticoId: diagnosticoId
        ? Number(diagnosticoId) || undefined
        : undefined,
    });
  }
}

import {
  Body,
  StreamableFile,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ANEXO_TAMANHO_MAXIMO } from '../tarefa-anexo/tarefa-anexo.service';
import { ARQUIVOS_POR_ENTREGA } from '../tarefa-anexo/entrega-arquivo.service';
import { createReadStream } from 'fs';
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

  @Get('tarefas/:id/anexos/:anexoId')
  @ApiOperation({ summary: 'Ver ou baixar um material da tarefa' })
  async baixarAnexo(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('anexoId', ParseIntPipe) anexoId: number,
  ) {
    const a = await this.painel.anexoParaBaixar(usuarioId, id, anexoId);
    return new StreamableFile(createReadStream(a.caminho), {
      type: a.mime,
      disposition: a.disposicao,
    });
  }

  @Post('tarefas/:id/entrega')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Enviar foto ou documento da tarefa feita (PNG, JPG, PDF, DOC ou DOCX; ate 3)',
  })
  @UseInterceptors(
    FilesInterceptor('arquivos', ARQUIVOS_POR_ENTREGA, {
      limits: { fileSize: ANEXO_TAMANHO_MAXIMO },
    }),
  )
  enviarArquivos(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() arquivos: Express.Multer.File[],
  ) {
    return this.painel.enviarArquivos(usuarioId, id, arquivos);
  }

  @Delete('tarefas/:id/entrega/:arquivoId')
  @ApiOperation({ summary: 'Tirar uma foto ou documento enviado' })
  removerArquivo(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('arquivoId', ParseIntPipe) arquivoId: number,
  ) {
    return this.painel.removerArquivo(usuarioId, id, arquivoId);
  }

  @Get('tarefas/:id/entrega/:arquivoId')
  @ApiOperation({ summary: 'Ver uma foto ou documento que enviei' })
  async baixarArquivo(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('arquivoId', ParseIntPipe) arquivoId: number,
  ) {
    const a = await this.painel.arquivoParaBaixar(usuarioId, id, arquivoId);
    return new StreamableFile(createReadStream(a.caminho), {
      type: a.mime,
      disposition: a.disposicao,
    });
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

  @Get('historico')
  @ApiOperation({ summary: 'Tarefas ja feitas (historico)' })
  historico(@UsuarioId() usuarioId: number) {
    return this.painel.historico(usuarioId);
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

import {
  Body,
  Controller,
  Get,
  Ip,
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
import { PainelFamiliaService } from './painel-familia.service';
import { EnviarIncentivoDto, PerfilFamiliaDto } from './dto/painel-familia.dto';
import { LgpdService } from '../lgpd/lgpd.service';
import { AceitarTermoDto } from '../lgpd/dto/lgpd.dto';

/** Rotas das telas "Familia - ..." do Figma. So os filhos do responsavel logado. */
@ApiTags('Painel da familia')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('responsavel')
@Controller('painel-familia')
export class PainelFamiliaController {
  constructor(
    private readonly painel: PainelFamiliaService,
    private readonly lgpd: LgpdService,
  ) {}

  @Post('termo')
  @ApiOperation({ summary: 'Aceitar o termo de uso e privacidade (LGPD)' })
  aceitarTermo(
    @UsuarioId() usuarioId: number,
    @Body() dto: AceitarTermoDto,
    @Ip() ip: string,
  ) {
    return this.lgpd.aceitarTermo(usuarioId, dto.versao, ip ?? null);
  }

  @Get('filhos/:id/dados')
  @ApiOperation({ summary: 'Copia de todos os dados do filho (LGPD)' })
  dadosDoFilho(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.lgpd.dadosParaFamilia(usuarioId, id);
  }

  @Post('filhos/:id/exclusao')
  @ApiOperation({
    summary: 'Pedir a exclusao dos dados do filho (LGPD)',
    description: 'A escola recebe o pedido e faz a exclusao.',
  })
  pedirExclusao(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.lgpd.pedirExclusao(usuarioId, id);
  }

  @Get('contexto')
  @ApiOperation({ summary: 'Responsavel, preferencias e filhos' })
  contexto(@UsuarioId() usuarioId: number) {
    return this.painel.contexto(usuarioId);
  }

  @Get('filhos/:id/painel')
  @ApiOperation({ summary: 'Painel familiar do filho' })
  painelFilho(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.painel(usuarioId, id);
  }

  @Post('filhos/:id/incentivos')
  @ApiOperation({ summary: 'Enviar incentivo (o mascote le para o filho)' })
  incentivo(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EnviarIncentivoDto,
  ) {
    return this.painel.enviarIncentivo(usuarioId, id, dto);
  }

  @Get('filhos/:id/tarefas')
  @ApiOperation({ summary: 'Tarefas do filho: atrasadas, a fazer e feitas' })
  tarefas(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.tarefas(usuarioId, id);
  }

  @Get('filhos/:id/avisos')
  @ApiOperation({ summary: 'Avisos da escola (turma do filho)' })
  avisos(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.avisos(usuarioId, id);
  }

  @Post('avisos/:id/lido')
  @ApiOperation({ summary: 'Marcar aviso como lido' })
  avisoLido(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.painel.marcarAvisoLido(usuarioId, id);
  }

  @Get('filhos/:id/relatorio')
  @ApiOperation({ summary: 'Relatorio do mes (?mes=AAAA-MM)' })
  relatorio(
    @UsuarioId() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('mes') mes?: string,
  ) {
    return this.painel.relatorio(usuarioId, id, mes);
  }

  @Patch('perfil')
  @ApiOperation({ summary: 'Dados do responsavel e avisos escolhidos' })
  perfil(@UsuarioId() usuarioId: number, @Body() dto: PerfilFamiliaDto) {
    return this.painel.salvarPerfil(usuarioId, dto);
  }
}

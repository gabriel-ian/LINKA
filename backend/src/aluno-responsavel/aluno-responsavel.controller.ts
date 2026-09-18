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
import { AlunoResponsavelService } from './aluno-responsavel.service';
import { CreateAlunoResponsavelDto } from './dto/create-aluno-responsavel.dto';

@ApiTags('Aluno-Responsavel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola')
@Controller('aluno-responsaveis')
export class AlunoResponsavelController {
  constructor(
    private readonly alunoResponsavelService: AlunoResponsavelService,
  ) {}

  @Get(':alunoId')
  @ApiOperation({ summary: 'Listar responsaveis de um aluno' })
  findAllByAluno(
    @Param('alunoId', ParseIntPipe) alunoId: number,
    @EscolaId() escolaId: number,
  ) {
    return this.alunoResponsavelService.findAllByAluno(alunoId, escolaId);
  }

  @Post()
  @ApiOperation({ summary: 'Vincular responsavel a um aluno' })
  create(
    @Body() body: CreateAlunoResponsavelDto,
    @EscolaId() escolaId: number,
  ) {
    return this.alunoResponsavelService.create(body, escolaId);
  }
}

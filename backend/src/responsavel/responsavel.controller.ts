import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { EscolaId } from '../auth/escola-id.decorator';
import { ResponsavelService } from './responsavel.service';
import { CreateResponsavelDto } from './dto/create-responsavel.dto';

@ApiTags('Responsaveis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('escola')
@Controller('responsaveis')
export class ResponsavelController {
  constructor(private readonly responsavelService: ResponsavelService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar responsaveis vinculados a alunos da escola logada',
  })
  findAll(@EscolaId() escolaId: number) {
    return this.responsavelService.findAllByEscola(escolaId);
  }

  @Post()
  @ApiOperation({
    summary: 'Cadastrar responsavel',
    description: 'Cria o usuario de acesso e o registro do responsavel juntos.',
  })
  create(@Body() body: CreateResponsavelDto) {
    return this.responsavelService.create(body);
  }
}

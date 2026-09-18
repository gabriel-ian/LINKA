import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { NeurodivergenciaService } from './neurodivergencia.service';
import { CreateNeurodivergenciaDto } from './dto/create-neurodivergencia.dto';

/** Catalogo global de neurodivergencias. Mesma regra da disciplina:
 * leitura liberada, escrita exclusiva do admin. */
@ApiTags('Neurodivergencias')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('neurodivergencias')
export class NeurodivergenciaController {
  constructor(
    private readonly neurodivergenciaService: NeurodivergenciaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar neurodivergencias' })
  findAll() {
    return this.neurodivergenciaService.findAll();
  }

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: 'Cadastrar neurodivergencia (exclusivo do admin)',
  })
  create(@Body() body: CreateNeurodivergenciaDto) {
    return this.neurodivergenciaService.create(body);
  }
}

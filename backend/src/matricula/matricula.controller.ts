import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { MatriculaService } from './matricula.service';
import { CreateMatriculaDto } from './dto/create-matricula.dto';

@ApiTags('Matriculas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('matriculas')
export class MatriculaController {
  constructor(private readonly matriculaService: MatriculaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar matrículas da escola' })
  findAll(@Req() req: Request & { user: any }) {
    return this.matriculaService.findAllByEscola(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Matricular aluno em turma' })
  create(
    @Body() body: CreateMatriculaDto,
    @Req() req: Request & { user: any },
  ) {
    return this.matriculaService.create(body, req.user.userId);
  }
}
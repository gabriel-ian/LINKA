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
import { TurmaService } from './turma.service';
import { CreateTurmaDto } from './dto/create-turma.dto';

@ApiTags('Turmas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('turmas')
export class TurmaController {
  constructor(private readonly turmaService: TurmaService) {}

  @Get()
  @ApiOperation({ summary: 'Listar turmas da escola logada' })
  findAll(@Req() req: Request & { user: any }) {
    return this.turmaService.findAllByEscola(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar turma' })
  create(
    @Body() body: CreateTurmaDto,
    @Req() req: Request & { user: any },
  ) {
    return this.turmaService.create(body, req.user.userId);
  }
}
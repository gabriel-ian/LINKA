import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TurmaService } from './turma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { Request } from 'express';

@ApiTags('Turmas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('turmas')
export class TurmaController {
  constructor(private readonly turmaService: TurmaService) {}

  @Post()
  @ApiOperation({ summary: 'Cadastrar turma' })
  create(
    @Body() body: CreateTurmaDto,
    @Req() req: Request & { user: any },
  ) {
    return this.turmaService.create(body, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar turmas da escola' })
  findAll(@Req() req: Request & { user: any }) {
    return this.turmaService.findAllByEscola(req.user.userId);
  }
}
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
import { AlunoService } from './aluno.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';

@ApiTags('Alunos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alunos')
export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  @Get()
  @ApiOperation({ summary: 'Listar alunos da escola logada' })
  findAll(@Req() req: Request & { user: any }) {
    return this.alunoService.findAllByEscola(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Cadastrar aluno' })
  create(
    @Body() body: CreateAlunoDto,
    @Req() req: Request & { user: any },
  ) {
    return this.alunoService.create(body, req.user.userId);
  }
}
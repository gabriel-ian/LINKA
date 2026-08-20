import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AlunoService } from './aluno.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { Request } from 'express';

@ApiTags('Alunos')
@ApiBearerAuth() // 🔒 habilita botão Authorize no Swagger
@UseGuards(JwtAuthGuard) // 🔒 protege todas as rotas
@Controller('alunos')
export class AlunoController {
  constructor(private readonly alunoService: AlunoService) {}

  
  @Get()
  @ApiOperation({
    summary: 'Listar alunos da escola logada',
  })
  findAll(@Req() req: Request & { user: any }) {
    return this.alunoService.findAllByEscola(req.user.userId);
  }

 
  @Post()
  @ApiOperation({
    summary: 'Cadastrar aluno',
  })
  create(
    @Body() body: CreateAlunoDto,
    @Req() req: Request & { user: any },
  ) {
    return this.alunoService.create(body, req.user.userId);
  }
}
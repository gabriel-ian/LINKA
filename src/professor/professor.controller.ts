import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfessorService } from './professor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
} from '@nestjs/swagger';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { Request } from 'express';

@ApiTags('Professores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('professores')
export class ProfessorController {
  constructor(private readonly professorService: ProfessorService) {}

  // 🔹 LISTAR PROFESSORES DA ESCOLA LOGADA
  @Get()
  @ApiOperation({
    summary: 'Listar professores da escola logada',
  })
  findAll(@Req() req: Request & { user: any }) {
    return this.professorService.findAllByEscola(req.user.userId);
  }

  
  @Post()
  @ApiOperation({
    summary: 'Cadastrar professor',
  })
  create(
    @Body() body: CreateProfessorDto,
    @Req() req: Request & { user: any },
  ) {
    return this.professorService.create(body, req.user.userId);
  }
}
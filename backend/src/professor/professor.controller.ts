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
import { ProfessorService } from './professor.service';
import { CreateProfessorDto } from './dto/create-professor.dto';

@ApiTags('Professores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('professores')
export class ProfessorController {
  constructor(private readonly professorService: ProfessorService) {}

  
  @Get()
  @ApiOperation({ summary: 'Listar professores da escola logada' })
  findAll(@Req() req: Request & { user: any }) {
    return this.professorService.findAllByEscola(req.user.id);
  }

  
  @Post()
  @ApiOperation({ summary: 'Cadastrar professor' })
  create(
    @Body() body: CreateProfessorDto,
    @Req() req: Request & { user: any },
  ) {
    return this.professorService.create(body, req.user.id);
  }
}
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateEscolaDto } from './dto/create-escola.dto';
import { UpdateEscolaDto } from './dto/update-escola.dto';
import { EscolaService } from './escola.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Escolas')
@ApiBearerAuth() 
@UseGuards(JwtAuthGuard) 
@Controller('escolas')
export class EscolaController {
  constructor(private readonly escolaService: EscolaService) {}

  
  @Get()
  @ApiOperation({
    summary: 'Listar escolas',
  })
  findAll(@Req() req: Request & { user: any }) {
    console.log('Usuário logado:', req.user);

    return this.escolaService.findAll();
  }

  
  @Get('me')
  @ApiOperation({
    summary: 'Buscar escola logada',
  })
  getMinhaEscola(@Req() req: Request & { user: any }) {
    return this.escolaService.findOne(req.user.userId);
  }

  
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar escola por ID',
  })
  findOne(@Param('id') id: string) {
    return this.escolaService.findOne(Number(id));
  }

  
  @Post()
  @ApiOperation({
    summary: 'Cadastrar escola',
  })
  create(@Body() body: CreateEscolaDto) {
    return this.escolaService.create(body);
  }

  
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar escola',
  })
  update(
    @Param('id') id: string,
    @Body() body: UpdateEscolaDto,
  ) {
    return this.escolaService.update(Number(id), body);
  }

  
  @Delete(':id')
  @ApiOperation({
    summary: 'Desativar escola',
  })
  remove(@Param('id') id: string) {
    return this.escolaService.remove(Number(id));
  }

  
  @Patch(':id/ativar')
  @ApiOperation({
    summary: 'Reativar escola',
  })
  activate(@Param('id') id: string) {
    return this.escolaService.activate(Number(id));
  }
}
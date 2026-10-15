import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class EnviarIncentivoDto {
  @ApiProperty({
    example: 'Você consegue! Que tal começar só pelo primeiro passo?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  mensagem!: string;

  @ApiPropertyOptional({ description: 'Tarefa que motivou o incentivo' })
  @IsOptional()
  @IsInt()
  tarefaId?: number;

  @ApiPropertyOptional({ description: 'O mascote le em voz alta' })
  @IsOptional()
  @IsBoolean()
  voz?: boolean;
}

export class PreferenciasFamiliaDto {
  @IsOptional() @IsBoolean() tarefaNaoIniciada?: boolean;
  @IsOptional() @IsBoolean() tarefaConcluida?: boolean;
  @IsOptional() @IsBoolean() avisosEscola?: boolean;
  @IsOptional() @IsBoolean() relatorioSemanal?: boolean;
  @IsOptional() @IsBoolean() resumoWhatsapp?: boolean;

  @IsOptional()
  @IsIn(['8h às 12h', '12h às 14h', '14h às 18h', '18h às 21h'])
  horario?: string;
}

export class PerfilFamiliaDto {
  @ApiPropertyOptional({ example: 'Maria Oliveira' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nomeCompleto?: string;

  @ApiPropertyOptional({ example: 'maria.oliveira@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '(46) 99912-3456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @ApiPropertyOptional({ type: PreferenciasFamiliaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferenciasFamiliaDto)
  preferencias?: PreferenciasFamiliaDto;
}

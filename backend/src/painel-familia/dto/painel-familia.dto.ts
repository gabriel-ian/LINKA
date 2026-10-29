import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
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

/** Nome, e-mail e telefone nao entram: so a escola muda esses dados. */
export class PerfilFamiliaDto {
  @ApiPropertyOptional({ type: PreferenciasFamiliaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferenciasFamiliaDto)
  preferencias?: PreferenciasFamiliaDto;
}

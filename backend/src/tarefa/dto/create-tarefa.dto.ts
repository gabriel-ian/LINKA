import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateTarefaDto {
  @ApiProperty({ example: 'Lista de exercicios - fracoes' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo!: string;

  @ApiPropertyOptional({
    example: 'Resolver os exercicios 1 a 10 da pagina 42',
  })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  data_entrega?: string;

  @ApiPropertyOptional({ example: '23:59' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'hora_limite deve estar no formato HH:mm',
  })
  hora_limite?: string;

  @ApiProperty()
  @IsNumber()
  turmaId!: number;

  @ApiProperty()
  @IsNumber()
  disciplinaId!: number;
}

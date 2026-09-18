import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class CreateEscolaDto {
  @ApiProperty({
    example: 'Colegio Nova Esperanca',
    description: 'Nome da escola',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nome!: string;

  @ApiPropertyOptional({
    example: '12.345.678/0001-90',
    description: 'CNPJ da escola',
  })
  @IsOptional()
  @IsString()
  @Length(14, 20)
  cnpj?: string;
}

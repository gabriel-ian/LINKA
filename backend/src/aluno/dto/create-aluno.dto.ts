import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * O aluno nao tem login: email e senha sairam deste DTO.
 * O acesso da familia e feito pelo responsavel (tabela usuario).
 */
export class CreateAlunoDto {
  @ApiProperty({ example: 'Lucas Pereira dos Santos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nomeCompleto!: string;

  @ApiPropertyOptional({ example: '2011-04-23' })
  @IsOptional()
  @IsDateString()
  data_nascimento?: string;

  @ApiPropertyOptional({ example: '2024001234', description: 'CGM do aluno' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cgm?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  neurodivergente?: boolean;

  @ApiPropertyOptional({
    example: 'laudos/lucas-2024.pdf',
    description: 'Caminho do laudo anexado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  laudo?: string;
}

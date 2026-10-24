import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ConcluirPassoDto {
  @ApiProperty({ example: 2, description: 'Numero do passo (1 = primeiro)' })
  @IsInt()
  @Min(1)
  @Max(30)
  passo!: number;

  @ApiPropertyOptional({
    example: '2026-10-18T14:05:00.000Z',
    description:
      'Quando o aluno fez o passo, se foi sem internet e so chegou agora. ' +
      'Aceito so nos ultimos 7 dias; senao vale a hora do envio.',
  })
  @IsOptional()
  @IsDateString()
  feitoEm?: string;
}

export class AjudaDto {
  @ApiProperty({ enum: ['explicar', 'exemplo', 'professora'] })
  @IsIn(['explicar', 'exemplo', 'professora'])
  tipo!: 'explicar' | 'exemplo' | 'professora';

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  @Max(30)
  passo!: number;
}

export class RespostaDto {
  @ApiProperty({
    example: '<p>Minha resposta: 12 + 8 = 20</p>',
    description: 'Texto do editor (HTML simples; o servidor limpa)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  resposta!: string;
}

export class LembreteDto {
  @ApiProperty({ example: 'Colocar a régua na mochila' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  texto!: string;

  @ApiProperty({ example: '2026-07-09T07:00:00' })
  @IsDateString()
  quando!: string;
}

export class PreferenciasDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  ouvirVoz?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  passosCurtos?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  letrasMaiores?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  modoCalmo?: boolean;

  @ApiPropertyOptional({ enum: ['dino', 'coruja', 'robo'] })
  @IsOptional()
  @IsIn(['dino', 'coruja', 'robo'])
  mascote?: 'dino' | 'coruja' | 'robo';

  @ApiPropertyOptional({ type: [String], example: ['Dinossauros', 'Futebol'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  interesses?: string[];
}

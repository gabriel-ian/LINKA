import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const ACOES_VIRADA = ['promover', 'reter', 'sair'] as const;
/** promover: proxima serie; reter: repete a serie; sair: fica sem turma. */
export type AcaoVirada = (typeof ACOES_VIRADA)[number];

/** Aluno que nao segue o padrao da tela (ex.: vai repetir a serie). */
export class DecisaoAlunoDto {
  @ApiProperty()
  @IsInt()
  alunoId!: number;

  @ApiProperty({ enum: ACOES_VIRADA })
  @IsIn(ACOES_VIRADA)
  acao!: AcaoVirada;
}

export class ViradaAnoDto {
  @ApiProperty({
    example: 2026,
    description: 'Ano que termina (o mesmo que a previa mostrou)',
  })
  @IsInt()
  @Min(2000)
  @Max(2100)
  anoOrigem!: number;

  @ApiProperty({
    description:
      'Copia os professores de cada turma para a turma da mesma serie e letra no novo ano',
  })
  @IsBoolean()
  copiarProfessores!: boolean;

  @ApiPropertyOptional({ type: [DecisaoAlunoDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5000)
  @ValidateNested({ each: true })
  @Type(() => DecisaoAlunoDto)
  decisoes?: DecisaoAlunoDto[];
}

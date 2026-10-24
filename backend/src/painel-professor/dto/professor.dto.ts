import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CriarTarefaProfessorDto {
  @ApiProperty({ example: 'Exercícios 5 a 10 - frações e porcentagem' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo!: string;

  @ApiProperty({
    description: 'Enunciado (HTML do editor); a IA adapta a partir dele',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  descricao!: string;

  @ApiProperty()
  @IsInt()
  turmaId!: number;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Outras turmas que recebem a mesma tarefa',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  outrasTurmas?: number[];

  @ApiProperty()
  @IsInt()
  disciplinaId!: number;

  @ApiProperty({ example: '2026-07-07' })
  @IsDateString()
  dataEntrega!: string;

  @ApiPropertyOptional({ example: '18:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'horaLimite deve ser HH:MM',
  })
  horaLimite?: string;
}

export class EditarTarefaProfessorDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo?: string;

  @ApiPropertyOptional({ description: 'Enunciado (HTML do editor)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20000)
  descricao?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  disciplinaId?: number;

  @ApiPropertyOptional({ example: '2026-07-07' })
  @IsOptional()
  @IsDateString()
  dataEntrega?: string;

  @ApiPropertyOptional({
    example: '18:00',
    description: 'Vazio tira o horario',
  })
  @IsOptional()
  @Matches(/^(([01]\d|2[0-3]):[0-5]\d)?$/, {
    message: 'horaLimite deve ser HH:MM',
  })
  horaLimite?: string;
}

export class CopiarTarefaDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  turmaIds!: number[];
}

export class EditarAdaptacaoDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(300, { each: true })
  passos!: string[];
}

export const TIPOS_COMUNICADO = [
  'atividade',
  'evento',
  'material',
  'aviso',
] as const;
export type TipoComunicado = (typeof TIPOS_COMUNICADO)[number];

export class SalvarComunicadoDto {
  @ApiPropertyOptional({ description: 'Id do rascunho a atualizar' })
  @IsOptional()
  @IsInt()
  id?: number;

  @ApiProperty()
  @IsInt()
  turmaId!: number;

  @ApiProperty({ enum: TIPOS_COMUNICADO })
  @IsIn(TIPOS_COMUNICADO)
  tipo!: TipoComunicado;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titulo!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(12000)
  mensagem!: string;

  @ApiProperty({ description: 'Gerar versao simplificada para alunos NEE' })
  @IsBoolean()
  simplificada!: boolean;

  @ApiProperty({ description: 'true salva sem enviar' })
  @IsBoolean()
  rascunho!: boolean;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTarefaAdaptadaDto {
  @ApiProperty()
  @IsNumber()
  tarefaId!: number;

  @ApiProperty()
  @IsNumber()
  alunoId!: number;

  @ApiProperty({ example: 'Resolva 3 dos 10 exercicios, com apoio visual.' })
  @IsString()
  @IsNotEmpty()
  descricaoAdaptada!: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Se a adaptacao foi gerada por IA ou escrita manualmente',
  })
  @IsOptional()
  @IsBoolean()
  geradoPorIa?: boolean;
}

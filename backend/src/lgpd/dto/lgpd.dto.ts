import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AceitarTermoDto {
  @ApiProperty({
    example: '2026-10',
    description: 'Versao do termo que a familia leu',
  })
  @IsString()
  @MaxLength(20)
  versao!: string;
}

export class AnonimizarAlunoDto {
  @ApiProperty({ description: 'Nome completo do aluno, para confirmar' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  confirmacao!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

/** "Alocacao": professor X da disciplina Y na turma Z. */
export class CreateAlocacaoDto {
  @ApiProperty()
  @IsNumber()
  turmaId!: number;

  @ApiProperty()
  @IsNumber()
  professorId!: number;

  @ApiProperty()
  @IsNumber()
  disciplinaId!: number;
}

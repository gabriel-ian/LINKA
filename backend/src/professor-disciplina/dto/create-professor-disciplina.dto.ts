import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateProfessorDisciplinaDto {
  @ApiProperty()
  @IsNumber()
  professorId!: number;

  @ApiProperty()
  @IsNumber()
  disciplinaId!: number;
}

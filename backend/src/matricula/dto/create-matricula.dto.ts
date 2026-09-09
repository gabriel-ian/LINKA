import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateMatriculaDto {
  @ApiProperty()
  @IsNumber()
  alunoId!: number;

  @ApiProperty()
  @IsNumber()
  turmaId!: number;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateAlunoResponsavelDto {
  @ApiProperty()
  @IsNumber()
  alunoId!: number;

  @ApiProperty()
  @IsNumber()
  responsavelId!: number;
}

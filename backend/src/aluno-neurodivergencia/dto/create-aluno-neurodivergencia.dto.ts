import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateAlunoNeurodivergenciaDto {
  @ApiProperty()
  @IsNumber()
  alunoId!: number;

  @ApiProperty()
  @IsNumber()
  neurodivergenciaId!: number;
}

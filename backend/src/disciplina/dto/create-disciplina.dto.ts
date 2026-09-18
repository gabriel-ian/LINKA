import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDisciplinaDto {
  @ApiProperty({ example: 'Matematica' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome!: string;
}

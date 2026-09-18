import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNeurodivergenciaDto {
  @ApiProperty({ example: 'TDAH' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nome!: string;
}

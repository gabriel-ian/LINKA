import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateEscolaDto {
  @ApiProperty({
    example: 'Colégio Nova Esperança',
    description: 'Nome da escola',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  nome!: string;
}
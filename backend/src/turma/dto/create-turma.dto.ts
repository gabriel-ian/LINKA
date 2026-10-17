import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTurmaDto {
  @ApiProperty()
  @IsString()
  nome!: string;
}

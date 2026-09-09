import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsDateString } from 'class-validator';

export class CreateAlunoDto {
  @ApiProperty()
  @IsString()
  nome!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  senha!: string;

  @ApiProperty()
  @IsDateString()
  data_nascimento!: string;
}
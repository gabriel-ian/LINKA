import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class CreateProfessorDto {
  @ApiProperty({
    example: 'Ana Silva',
    description: 'Nome do professor',
  })
  @IsString()
  nome!: string;

  @ApiProperty({
    example: 'ana@email.com',
    description: 'Email do professor',
  })
  @IsEmail()
  email!: string;
}
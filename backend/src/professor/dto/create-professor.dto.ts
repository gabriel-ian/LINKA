import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail } from 'class-validator';

export class CreateProfessorDto {

  @ApiProperty({
    example: 'Maria Silva',
    description: 'Nome do professor',
  })
  @IsString()
  nome!: string;

  @ApiProperty({
    example: 'maria@email.com',
    description: 'Email do professor',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Senha do professor',
  })
  @IsString()
  senha!: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@linka.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  senha!: string;

  // `perfil` foi removido de proposito: quem decide o perfil e o banco,
  // nao o cliente. Enviar perfil aqui agora resulta em 400
  // (forbidNonWhitelisted esta ligado no main.ts).
}

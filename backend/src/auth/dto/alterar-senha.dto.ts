import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AlterarSenhaDto {
  @ApiProperty()
  @IsString()
  senhaAtual!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  novaSenha!: string;
}

/** Primeiro acesso: so a nova senha (a provisoria acabou de ser usada no login). */
export class CriarSenhaDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  novaSenha!: string;
}

/** "Esqueci minha senha": so o e-mail da conta. */
export class EsqueciSenhaDto {
  @ApiProperty()
  @IsEmail()
  email!: string;
}

/** Nova senha a partir do link recebido por e-mail. */
export class RedefinirSenhaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  novaSenha!: string;
}

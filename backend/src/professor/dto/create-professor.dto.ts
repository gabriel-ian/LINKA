import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Criar professor cria DOIS registros: um `usuario` (perfil professor,
 * com email e senha) e um `professor` ligado a ele por usuario_id.
 */
export class CreateProfessorDto {
  @ApiProperty({ example: 'Maria Silva dos Santos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nomeCompleto!: string;

  @ApiProperty({ example: 'maria@escola.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  senha!: string;
}

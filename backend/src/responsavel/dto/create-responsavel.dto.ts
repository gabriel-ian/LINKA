import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Criar responsavel cria DOIS registros: um `usuario` (perfil responsavel,
 * com email e senha) e um `responsavel` ligado a ele por usuario_id —
 * mesmo padrao do CreateProfessorDto.
 */
export class CreateResponsavelDto {
  @ApiProperty({ example: 'Carla Souza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nomeCompleto!: string;

  @ApiPropertyOptional({ example: '(11) 91234-5678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @ApiProperty({ example: 'carla@familia.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  senha!: string;
}

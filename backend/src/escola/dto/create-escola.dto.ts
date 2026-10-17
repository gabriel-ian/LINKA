import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type { PlanoEscola } from '../escola.entity';

/**
 * Cadastrar escola cria DOIS registros: a `escola` e o `usuario`
 * (perfil escola) com o e-mail institucional e a senha de acesso.
 */
export class CreateEscolaDto {
  @ApiProperty({ example: 'E.E Leonardo da Vinci' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  nome!: string;

  @ApiPropertyOptional({ example: '12.345.678/0001-90' })
  @IsOptional()
  @IsString()
  @Length(14, 20)
  cnpj?: string;

  @ApiPropertyOptional({ example: '41123456', description: 'Codigo INEP' })
  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'inep deve ter 8 digitos' })
  inep?: string;

  @ApiPropertyOptional({ example: 'Rua Tenente Camargo, 1200 - Centro' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  endereco?: string;

  @ApiPropertyOptional({ example: 'Francisco Beltrão' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  cidade?: string;

  @ApiPropertyOptional({ example: 'PR' })
  @IsOptional()
  @Matches(/^[A-Z]{2}$/, { message: 'uf deve ter 2 letras maiusculas' })
  uf?: string;

  @ApiPropertyOptional({ example: 'Mariana Costa' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  responsavel?: string;

  @ApiPropertyOptional({ example: '(46) 3524-1100' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @ApiPropertyOptional({ enum: ['basico', 'institucional'], default: 'basico' })
  @IsOptional()
  @IsIn(['basico', 'institucional'])
  plano?: PlanoEscola;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  limiteProfessores?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsInt()
  @Min(0)
  limiteAlunosNee?: number;

  @ApiProperty({ example: 'leonardodavinci@escola.pr.gov.br' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'senhaSegura1', minLength: 8 })
  @IsString()
  @MinLength(8)
  senha!: string;
}

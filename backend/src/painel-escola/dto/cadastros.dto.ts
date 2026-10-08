import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import type { TurnoTurma } from '../../turma/turma.entity';

export class CriarTurmaDto {
  @ApiProperty({ example: '8º Ano' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  serie!: string;

  @ApiProperty({ example: 'C' })
  @Matches(/^[A-Za-z0-9]{1,5}$/, {
    message: 'letra deve ter de 1 a 5 letras ou numeros',
  })
  letra!: string;

  @ApiProperty({ enum: ['manha', 'tarde', 'noite', 'integral'] })
  @IsIn(['manha', 'tarde', 'noite', 'integral'])
  turno!: TurnoTurma;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  anoLetivo!: number;

  @ApiPropertyOptional({ example: 'Sala 12' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sala?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limiteAlunos?: number;

  @ApiPropertyOptional({
    type: [Number],
    description: 'Professores que vao lecionar na turma',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  professorIds?: number[];
}

/** Cria usuario (perfil professor) + professor + disciplinas + turmas. */
export class CriarProfessorDto {
  @ApiProperty({ example: 'Ana Beatriz Souza' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nomeCompleto!: string;

  @ApiProperty({ example: 'ana.souza@escola.pr.gov.br' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  senha!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Matemática', 'Ciências'],
    description: 'Nomes; disciplinas novas ("+ Outra") sao criadas',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  disciplinas?: string[];

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  turmaIds?: number[];
}

export class AtualizarProfessorDto {
  @ApiProperty({ description: 'false desativa o login do professor' })
  @IsBoolean()
  ativo!: boolean;
}

export class ResponsavelDto {
  @ApiProperty({ example: 'Maria Oliveira' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nomeCompleto!: string;

  @ApiProperty({ example: 'maria.oliveira@email.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: '(46) 99912-3456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @ApiPropertyOptional({ example: 'Mãe' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  parentesco?: string;
}

/** Cria aluno (+ login opcional) + diagnosticos + matricula + responsavel. */
export class CriarAlunoDto {
  @ApiProperty({ example: 'Lucas Oliveira' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nomeCompleto!: string;

  @ApiPropertyOptional({ example: '2012-03-12' })
  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @ApiPropertyOptional({ example: '3517439' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cgm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  turmaId?: number;

  @ApiPropertyOptional({ description: 'Login do aluno (opcional)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    minLength: 8,
    description: 'Obrigatoria quando ha e-mail',
  })
  @ValidateIf((o: CriarAlunoDto) => !!o.email)
  @IsString()
  @MinLength(8)
  senha?: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  diagnosticoIds?: number[];

  @ApiPropertyOptional({ description: 'Aluno NEE sem diagnostico informado' })
  @IsOptional()
  @IsBoolean()
  prefiroNaoInformar?: boolean;

  @ApiPropertyOptional({ type: ResponsavelDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ResponsavelDto)
  responsavel?: ResponsavelDto;
}

/**
 * Perfil de aprendizagem (usado pela IA para personalizar as tarefas).
 * Escola e professor podem editar. null limpa o campo.
 */
export class PerfilAprendizagemDto {
  @ApiPropertyOptional({ example: 'Iniciar tarefas e manter o foco.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  dificuldades?: string | null;

  @ApiPropertyOptional({ example: 'Criatividade e raciocinio visual.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  pontosFortes?: string | null;

  @ApiPropertyOptional({ type: [String], example: ['Dinossauros', 'Futebol'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  interesses?: string[];
}

/** Edicao do aluno pela escola. Campo ausente = nao muda; null = limpa. */
export class EditarAlunoDto extends PerfilAprendizagemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nomeCompleto?: string;

  @ApiPropertyOptional({ example: '2012-03-12' })
  @IsOptional()
  @IsDateString()
  dataNascimento?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  cgm?: string | null;

  @ApiPropertyOptional({
    description: 'Troca de turma; null tira o aluno da turma',
  })
  @IsOptional()
  @IsInt()
  turmaId?: number | null;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  diagnosticoIds?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  prefiroNaoInformar?: boolean;
}

/** Edicao da turma: mesmos campos do cadastro, todos opcionais. */
export class EditarTurmaDto extends PartialType(CriarTurmaDto) {}

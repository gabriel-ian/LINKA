import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const MOTIVOS_DESATIVACAO = [
  'Fim do contrato',
  'Solicitação da escola',
  'Pagamento pendente',
  'Outro',
] as const;

export class DesativarEscolaDto {
  @ApiProperty({ enum: MOTIVOS_DESATIVACAO })
  @IsIn(MOTIVOS_DESATIVACAO)
  motivo!: (typeof MOTIVOS_DESATIVACAO)[number];

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  data!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observacao?: string;
}

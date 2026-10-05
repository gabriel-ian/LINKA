import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber } from 'class-validator';
import { StatusTarefa } from '../tarefa-status.entity';

export class UpdateTarefaStatusDto {
  @ApiProperty()
  @IsNumber()
  alunoId!: number;

  @ApiProperty()
  @IsNumber()
  tarefaId!: number;

  @ApiProperty({ enum: ['pendente', 'concluida'] })
  @IsIn(['pendente', 'concluida'])
  status!: StatusTarefa;
}

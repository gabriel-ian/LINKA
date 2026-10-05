import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarefaStatusEntity } from './tarefa-status.entity';
import { TarefaStatusService } from './tarefa-status.service';
import { TarefaStatusController } from './tarefa-status.controller';
import { Aluno } from '../aluno/aluno.entity';
import { Tarefa } from '../tarefa/tarefa.entity';
import { Matricula } from '../matricula/matricula.entity';
import { Responsavel } from '../responsavel/responsavel.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TarefaStatusEntity,
      Aluno,
      Tarefa,
      Matricula,
      Responsavel,
    ]),
  ],
  providers: [TarefaStatusService],
  controllers: [TarefaStatusController],
  exports: [TarefaStatusService],
})
export class TarefaStatusModule {}

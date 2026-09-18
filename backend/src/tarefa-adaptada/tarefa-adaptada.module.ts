import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TarefaAdaptada } from './tarefa-adaptada.entity';
import { TarefaAdaptadaService } from './tarefa-adaptada.service';
import { TarefaAdaptadaController } from './tarefa-adaptada.controller';
import { Tarefa } from '../tarefa/tarefa.entity';
import { Aluno } from '../aluno/aluno.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TarefaAdaptada, Tarefa, Aluno])],
  providers: [TarefaAdaptadaService],
  controllers: [TarefaAdaptadaController],
})
export class TarefaAdaptadaModule {}

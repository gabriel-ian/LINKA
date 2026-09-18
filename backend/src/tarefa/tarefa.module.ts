import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tarefa } from './tarefa.entity';
import { TarefaService } from './tarefa.service';
import { TarefaController } from './tarefa.controller';
import { Turma } from '../turma/turma.entity';
import { Disciplina } from '../disciplina/disciplina.entity';
import { Professor } from '../professor/professor.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tarefa, Turma, Disciplina, Professor]),
  ],
  providers: [TarefaService],
  controllers: [TarefaController],
  exports: [TarefaService, TypeOrmModule],
})
export class TarefaModule {}

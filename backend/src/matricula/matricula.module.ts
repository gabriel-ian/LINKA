import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Matricula } from './matricula.entity';
import { MatriculaService } from './matricula.service';
import { MatriculaController } from './matricula.controller';
import { Aluno } from '../aluno/aluno.entity';
import { Turma } from '../turma/turma.entity';
import { TarefaStatusModule } from '../tarefa-status/tarefa-status.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Matricula, Aluno, Turma]),
    TarefaStatusModule,
  ],
  providers: [MatriculaService],
  controllers: [MatriculaController],
})
export class MatriculaModule {}

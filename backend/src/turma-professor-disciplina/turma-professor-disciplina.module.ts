import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TurmaProfessorDisciplina } from './turma-professor-disciplina.entity';
import { TurmaProfessorDisciplinaService } from './turma-professor-disciplina.service';
import { TurmaProfessorDisciplinaController } from './turma-professor-disciplina.controller';
import { Turma } from '../turma/turma.entity';
import { Professor } from '../professor/professor.entity';
import { Disciplina } from '../disciplina/disciplina.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TurmaProfessorDisciplina,
      Turma,
      Professor,
      Disciplina,
    ]),
  ],
  providers: [TurmaProfessorDisciplinaService],
  controllers: [TurmaProfessorDisciplinaController],
})
export class TurmaProfessorDisciplinaModule {}

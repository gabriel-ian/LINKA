import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessorDisciplina } from './professor-disciplina.entity';
import { ProfessorDisciplinaService } from './professor-disciplina.service';
import { ProfessorDisciplinaController } from './professor-disciplina.controller';
import { Professor } from '../professor/professor.entity';
import { Disciplina } from '../disciplina/disciplina.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProfessorDisciplina, Professor, Disciplina]),
  ],
  providers: [ProfessorDisciplinaService],
  controllers: [ProfessorDisciplinaController],
})
export class ProfessorDisciplinaModule {}

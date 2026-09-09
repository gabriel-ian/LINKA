import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Matricula } from './matricula.entity';
import { MatriculaService } from './matricula.service';
import { MatriculaController } from './matricula.controller';
import { Aluno } from 'src/aluno/aluno.entity';
import { Turma } from 'src/turma/turma.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Matricula, Aluno, Turma])],
  providers: [MatriculaService],
  controllers: [MatriculaController],
})
export class MatriculaModule {}
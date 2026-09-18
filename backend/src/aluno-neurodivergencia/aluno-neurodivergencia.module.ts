import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlunoNeurodivergencia } from './aluno-neurodivergencia.entity';
import { AlunoNeurodivergenciaService } from './aluno-neurodivergencia.service';
import { AlunoNeurodivergenciaController } from './aluno-neurodivergencia.controller';
import { Aluno } from '../aluno/aluno.entity';
import { Neurodivergencia } from '../neurodivergencia/neurodivergencia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AlunoNeurodivergencia, Aluno, Neurodivergencia]),
  ],
  providers: [AlunoNeurodivergenciaService],
  controllers: [AlunoNeurodivergenciaController],
})
export class AlunoNeurodivergenciaModule {}

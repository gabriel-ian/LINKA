import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlunoResponsavel } from './aluno-responsavel.entity';
import { AlunoResponsavelService } from './aluno-responsavel.service';
import { AlunoResponsavelController } from './aluno-responsavel.controller';
import { Aluno } from '../aluno/aluno.entity';
import { Responsavel } from '../responsavel/responsavel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AlunoResponsavel, Aluno, Responsavel])],
  providers: [AlunoResponsavelService],
  controllers: [AlunoResponsavelController],
})
export class AlunoResponsavelModule {}

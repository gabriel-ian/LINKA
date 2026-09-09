import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turma } from './turma.entity';
import { TurmaService } from './turma.service';
import { TurmaController } from './turma.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Turma])],
  providers: [TurmaService],
  controllers: [TurmaController],
  exports: [TurmaService],
})
export class TurmaModule {}
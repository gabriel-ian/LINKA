import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Professor } from './professor.entity';
import { ProfessorService } from './professor.service';
import { ProfessorController } from './professor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Professor])],
  providers: [ProfessorService],
  controllers: [ProfessorController],
})
export class ProfessorModule {}
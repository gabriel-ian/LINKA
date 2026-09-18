import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Professor } from './professor.entity';
import { ProfessorService } from './professor.service';
import { ProfessorController } from './professor.controller';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [TypeOrmModule.forFeature([Professor]), UsuarioModule],
  providers: [ProfessorService],
  controllers: [ProfessorController],
  exports: [ProfessorService],
})
export class ProfessorModule {}

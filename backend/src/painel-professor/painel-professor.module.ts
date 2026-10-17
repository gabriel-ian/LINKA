import { Module } from '@nestjs/common';
import { TarefaModule } from '../tarefa/tarefa.module';
import { PainelProfessorController } from './painel-professor.controller';
import { PainelProfessorService } from './painel-professor.service';
import { AdaptacaoIaService } from './adaptacao-ia.service';

/** Telas do perfil professor, incluindo a adaptacao de tarefas por IA. */
@Module({
  imports: [TarefaModule],
  controllers: [PainelProfessorController],
  providers: [PainelProfessorService, AdaptacaoIaService],
  exports: [AdaptacaoIaService],
})
export class PainelProfessorModule {}

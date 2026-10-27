import { Module } from '@nestjs/common';
import { TarefaAnexoService } from './tarefa-anexo.service';

/** Arquivos anexados as tarefas (usado pelos paineis do professor e do aluno). */
@Module({
  providers: [TarefaAnexoService],
  exports: [TarefaAnexoService],
})
export class TarefaAnexoModule {}

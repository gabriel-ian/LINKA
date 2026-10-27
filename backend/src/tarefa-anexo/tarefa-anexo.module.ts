import { Module } from '@nestjs/common';
import { TarefaAnexoService } from './tarefa-anexo.service';
import { EntregaArquivoService } from './entrega-arquivo.service';

/** Arquivos das tarefas: materiais do professor e entregas do aluno. */
@Module({
  providers: [TarefaAnexoService, EntregaArquivoService],
  exports: [TarefaAnexoService, EntregaArquivoService],
})
export class TarefaAnexoModule {}

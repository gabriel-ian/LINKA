import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PainelProfessorModule } from '../painel-professor/painel-professor.module';
import { AvisosFamiliaModule } from '../avisos-familia/avisos-familia.module';
import { AlunoLembrete } from './aluno-lembrete.entity';
import { PedidoAjuda } from './pedido-ajuda.entity';
import { Incentivo } from '../painel-familia/incentivo.entity';
import { PainelAlunoController } from './painel-aluno.controller';
import { PainelAlunoService } from './painel-aluno.service';
import { TarefaAnexoModule } from '../tarefa-anexo/tarefa-anexo.module';

/** Telas do perfil aluno: tarefas passo a passo, pontos, conquistas e agenda. */
@Module({
  imports: [
    TypeOrmModule.forFeature([AlunoLembrete, PedidoAjuda, Incentivo]),
    PainelProfessorModule,
    AvisosFamiliaModule,
    TarefaAnexoModule,
  ],
  controllers: [PainelAlunoController],
  providers: [PainelAlunoService],
  exports: [PainelAlunoService],
})
export class PainelAlunoModule {}

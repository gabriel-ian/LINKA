import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PainelAlunoModule } from '../painel-aluno/painel-aluno.module';
import { LgpdModule } from '../lgpd/lgpd.module';
import { TarefaAnexoModule } from '../tarefa-anexo/tarefa-anexo.module';
import { Incentivo } from './incentivo.entity';
import { PainelFamiliaController } from './painel-familia.controller';
import { PainelFamiliaService } from './painel-familia.service';
import { ResumoEmailService } from './resumo-email.service';

/**
 * Telas do perfil responsavel: painel, incentivo, avisos, relatorios e
 * configuracoes; e o resumo semanal por e-mail.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Incentivo]),
    PainelAlunoModule,
    LgpdModule,
    TarefaAnexoModule,
  ],
  controllers: [PainelFamiliaController],
  providers: [PainelFamiliaService, ResumoEmailService],
})
export class PainelFamiliaModule {}

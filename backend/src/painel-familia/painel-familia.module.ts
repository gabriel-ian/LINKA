import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PainelAlunoModule } from '../painel-aluno/painel-aluno.module';
import { Incentivo } from './incentivo.entity';
import { PainelFamiliaController } from './painel-familia.controller';
import { PainelFamiliaService } from './painel-familia.service';
import { ResumoEmailService } from './resumo-email.service';

/**
 * Telas do perfil responsavel: painel, incentivo, avisos, relatorios e
 * configuracoes; e o resumo semanal por e-mail.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Incentivo]), PainelAlunoModule],
  controllers: [PainelFamiliaController],
  providers: [PainelFamiliaService, ResumoEmailService],
})
export class PainelFamiliaModule {}

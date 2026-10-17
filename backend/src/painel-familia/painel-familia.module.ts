import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PainelAlunoModule } from '../painel-aluno/painel-aluno.module';
import { Incentivo } from './incentivo.entity';
import { PainelFamiliaController } from './painel-familia.controller';
import { PainelFamiliaService } from './painel-familia.service';

/** Telas do perfil responsavel: painel, incentivo, avisos, relatorios e configuracoes. */
@Module({
  imports: [TypeOrmModule.forFeature([Incentivo]), PainelAlunoModule],
  controllers: [PainelFamiliaController],
  providers: [PainelFamiliaService],
})
export class PainelFamiliaModule {}

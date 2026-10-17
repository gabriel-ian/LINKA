import { Module } from '@nestjs/common';
import { TarefaStatusModule } from '../tarefa-status/tarefa-status.module';
import { PainelEscolaController } from './painel-escola.controller';
import { PainelEscolaService } from './painel-escola.service';
import { CadastrosEscolaService } from './cadastros-escola.service';

/** Telas do perfil escola: leituras agregadas e cadastros compostos. */
@Module({
  imports: [TarefaStatusModule],
  controllers: [PainelEscolaController],
  providers: [PainelEscolaService, CadastrosEscolaService],
})
export class PainelEscolaModule {}

import { Module } from '@nestjs/common';
import { AvisosFamiliaService } from './avisos-familia.service';

/** Avisos por e-mail para a familia (usado pelos paineis do aluno e do professor). */
@Module({
  providers: [AvisosFamiliaService],
  exports: [AvisosFamiliaService],
})
export class AvisosFamiliaModule {}

import { Module } from '@nestjs/common';
import { LgpdService } from './lgpd.service';

/** LGPD: termo, copia dos dados, exclusao e registro de acesso ao laudo. */
@Module({
  providers: [LgpdService],
  exports: [LgpdService],
})
export class LgpdModule {}

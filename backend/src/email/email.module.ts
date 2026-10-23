import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

/** Global: cadastros, auth e o resumo semanal enviam e-mails. */
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

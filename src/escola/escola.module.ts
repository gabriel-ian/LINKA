import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Escola } from './escola.entity';
import { EscolaService } from './escola.service';
import { EscolaController } from './escola.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Escola])],
  providers: [EscolaService],
  controllers: [EscolaController],
  exports: [EscolaService],
})
export class EscolaModule {}
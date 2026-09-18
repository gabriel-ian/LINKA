import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Neurodivergencia } from './neurodivergencia.entity';
import { NeurodivergenciaService } from './neurodivergencia.service';
import { NeurodivergenciaController } from './neurodivergencia.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Neurodivergencia])],
  providers: [NeurodivergenciaService],
  controllers: [NeurodivergenciaController],
  exports: [NeurodivergenciaService, TypeOrmModule],
})
export class NeurodivergenciaModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Responsavel } from './responsavel.entity';
import { ResponsavelService } from './responsavel.service';
import { ResponsavelController } from './responsavel.controller';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [TypeOrmModule.forFeature([Responsavel]), UsuarioModule],
  providers: [ResponsavelService],
  controllers: [ResponsavelController],
  exports: [ResponsavelService, TypeOrmModule],
})
export class ResponsavelModule {}

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlunoModule } from './aluno/aluno.module';
import { EscolaModule } from './escola/escola.module';
import { AuthModule } from './auth/auth.module';
import { ProfessorModule } from './professor/professor.module';
import { TurmaModule } from './turma/turma.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '1234',
      database: 'plataforma_educacional',

      autoLoadEntities: true,
      synchronize: false,
      logging: true,
    }),
    AlunoModule,
    EscolaModule,
    AuthModule,
    ProfessorModule,
    TurmaModule,

    
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
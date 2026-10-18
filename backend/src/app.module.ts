import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { LimiteGuard } from './auth/limite.guard';

import { AlunoModule } from './aluno/aluno.module';
import { EscolaModule } from './escola/escola.module';
import { AuthModule } from './auth/auth.module';
import { ProfessorModule } from './professor/professor.module';
import { TurmaModule } from './turma/turma.module';
import { MatriculaModule } from './matricula/matricula.module';
import { UsuarioModule } from './usuario/usuario.module';
import { AdminController } from './admin/admin.controller';
import { DisciplinaModule } from './disciplina/disciplina.module';
import { NeurodivergenciaModule } from './neurodivergencia/neurodivergencia.module';
import { ProfessorDisciplinaModule } from './professor-disciplina/professor-disciplina.module';
import { TurmaProfessorDisciplinaModule } from './turma-professor-disciplina/turma-professor-disciplina.module';
import { AlunoNeurodivergenciaModule } from './aluno-neurodivergencia/aluno-neurodivergencia.module';
import { ResponsavelModule } from './responsavel/responsavel.module';
import { AlunoResponsavelModule } from './aluno-responsavel/aluno-responsavel.module';
import { TarefaModule } from './tarefa/tarefa.module';
import { TarefaAdaptadaModule } from './tarefa-adaptada/tarefa-adaptada.module';
import { TarefaStatusModule } from './tarefa-status/tarefa-status.module';
import { PainelEscolaModule } from './painel-escola/painel-escola.module';
import { PainelProfessorModule } from './painel-professor/painel-professor.module';
import { PainelAlunoModule } from './painel-aluno/painel-aluno.module';
import { PainelFamiliaModule } from './painel-familia/painel-familia.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: Number(config.get<string>('DB_PORT') ?? 3306),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD') ?? '',
        database: config.getOrThrow<string>('DB_NAME'),

        autoLoadEntities: true,
        // Continua false de proposito: o schema e mantido no MySQL,
        // o TypeORM nao deve alterar tabela nenhuma.
        synchronize: false,
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
    }),
    // Limite geral contra abuso da API (por usuario ou IP, ver LimiteGuard).
    // Login e senha tem limites proprios, bem menores (ver AuthController).
    ThrottlerModule.forRoot([{ name: 'geral', ttl: 60_000, limit: 300 }]),
    UsuarioModule,
    AlunoModule,
    EscolaModule,
    AuthModule,
    ProfessorModule,
    TurmaModule,
    MatriculaModule,
    DisciplinaModule,
    NeurodivergenciaModule,
    ProfessorDisciplinaModule,
    TurmaProfessorDisciplinaModule,
    AlunoNeurodivergenciaModule,
    ResponsavelModule,
    AlunoResponsavelModule,
    TarefaModule,
    TarefaAdaptadaModule,
    TarefaStatusModule,
    PainelEscolaModule,
    PainelProfessorModule,
    PainelAlunoModule,
    PainelFamiliaModule,
  ],
  controllers: [AdminController],
  providers: [{ provide: APP_GUARD, useClass: LimiteGuard }],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { EscolaModule } from '../escola/escola.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    EscolaModule,
    JwtModule.register({
      secret: 'segredo-super-seguro',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}